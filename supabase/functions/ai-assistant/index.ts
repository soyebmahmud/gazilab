import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, prompt, context } = await req.json();
    console.log("Gazi Inventory Assistant request:", { type, prompt: prompt?.substring(0, 100) });

    let systemPrompt = "";
    let enrichedPrompt = prompt;

    // Fetch comprehensive data for chatbot
    if (type === "chatbot") {
      // Fetch ALL relevant inventory data for comprehensive answers
      const [
        stockSummaryResult,
        expiryAlertsResult,
        recentSalesResult,
        productionBatchesResult,
        rawMaterialsResult,
        productsResult,
        bomResult,
        saleReturnsResult
      ] = await Promise.all([
        supabase.rpc("get_stock_summary"),
        supabase.rpc("get_expiry_alerts", { p_days: 90 }),
        supabase.from("sales").select("*, sale_items(*, products(name))").order("sale_date", { ascending: false }).limit(50),
        supabase.from("production_batches").select("*, products(name), bom(version, estimated_cost)").order("created_at", { ascending: false }).limit(50),
        supabase.from("raw_materials").select("*").eq("is_active", true).order("name"),
        supabase.from("products").select("*").eq("is_active", true).order("name"),
        supabase.from("bom").select("*, products(name), items:bom_items(*, raw_material:raw_materials(name, current_stock, unit))").eq("is_active", true),
        supabase.from("sale_returns").select("*, products(name), sales(invoice_number)").order("created_at", { ascending: false }).limit(20)
      ]);

      const stockSummary = stockSummaryResult.data || [];
      const expiryAlerts = expiryAlertsResult.data || [];
      const recentSales = recentSalesResult.data || [];
      const productionBatches = productionBatchesResult.data || [];
      const rawMaterials = rawMaterialsResult.data || [];
      const products = productsResult.data || [];
      const boms = bomResult.data || [];
      const saleReturns = saleReturnsResult.data || [];

      // Calculate production feasibility for each product with active BOM
      const productionFeasibility = boms.map(bom => {
        const items = bom.items || [];
        const canProduce = items.every((item: any) => {
          const requiredPerUnit = item.quantity_per_unit * (1 + (item.wastage_percent || 0) / 100);
          return (item.raw_material?.current_stock || 0) >= requiredPerUnit;
        });
        
        const blockingMaterials = items.filter((item: any) => {
          const requiredPerUnit = item.quantity_per_unit * (1 + (item.wastage_percent || 0) / 100);
          return (item.raw_material?.current_stock || 0) < requiredPerUnit;
        }).map((item: any) => ({
          name: item.raw_material?.name,
          available: item.raw_material?.current_stock,
          required: item.quantity_per_unit * (1 + (item.wastage_percent || 0) / 100),
          unit: item.raw_material?.unit
        }));

        // Calculate max producible quantity
        let maxQuantity = Infinity;
        items.forEach((item: any) => {
          const requiredPerUnit = item.quantity_per_unit * (1 + (item.wastage_percent || 0) / 100);
          const available = item.raw_material?.current_stock || 0;
          const canMake = requiredPerUnit > 0 ? Math.floor(available / requiredPerUnit) : 0;
          maxQuantity = Math.min(maxQuantity, canMake);
        });

        return {
          productName: bom.products?.name,
          bomVersion: bom.version,
          canProduce,
          maxProducibleQuantity: maxQuantity === Infinity ? 0 : maxQuantity,
          blockingMaterials
        };
      });

      systemPrompt = `You are "Gazi Inventory Assistant" - an intelligent inventory management assistant for Gazi Laboratories ERP system. You have FULL ACCESS to all inventory data and can answer detailed questions about:

- Raw Materials (stock levels, usage in BOMs)
- Products (finished goods, stock status)
- Bill of Materials (BOMs - recipes for products)
- Production Batches (manufacturing status)
- Sales and Returns
- Expiry alerts

CURRENT DATA SNAPSHOT:

=== RAW MATERIALS (${rawMaterials.length} items) ===
${JSON.stringify(rawMaterials.map(m => ({
  name: m.name,
  sku: m.sku,
  category: m.category,
  currentStock: m.current_stock,
  unit: m.unit,
  minStockLevel: m.min_stock_level,
  status: m.current_stock <= 0 ? 'OUT_OF_STOCK' : m.current_stock <= m.min_stock_level ? 'LOW_STOCK' : 'OK'
})), null, 2)}

=== PRODUCTS (${products.length} items) ===
${JSON.stringify(products.map(p => ({
  name: p.name,
  sku: p.sku,
  category: p.category,
  currentStock: p.current_stock,
  unit: p.unit,
  minStockLevel: p.min_stock_level,
  sellingPrice: p.selling_price,
  unitsPerPack: p.units_per_pack,
  status: p.current_stock <= 0 ? 'OUT_OF_STOCK' : p.current_stock <= p.min_stock_level ? 'LOW_STOCK' : 'OK'
})), null, 2)}

=== BILL OF MATERIALS (Active BOMs) ===
${JSON.stringify(boms.map(b => ({
  productName: b.products?.name,
  version: b.version,
  estimatedCost: b.estimated_cost,
  materials: b.items?.map((i: any) => ({
    material: i.raw_material?.name,
    quantityPerUnit: i.quantity_per_unit,
    wastagePercent: i.wastage_percent,
    availableStock: i.raw_material?.current_stock,
    unit: i.raw_material?.unit
  }))
})), null, 2)}

=== PRODUCTION FEASIBILITY ANALYSIS ===
${JSON.stringify(productionFeasibility, null, 2)}

=== PRODUCTION BATCHES (Recent ${productionBatches.length}) ===
${JSON.stringify(productionBatches.map(b => ({
  batchNumber: b.batch_number,
  product: b.products?.name,
  status: b.status,
  plannedQty: b.quantity_planned,
  producedQty: b.quantity_produced,
  manufacturingDate: b.manufacturing_date,
  expiryDate: b.expiry_date
})), null, 2)}

=== EXPIRY ALERTS (${expiryAlerts.length} items expiring within 90 days) ===
${JSON.stringify(expiryAlerts, null, 2)}

=== STOCK SUMMARY ===
${JSON.stringify(stockSummary, null, 2)}

=== RECENT SALES (${recentSales.length}) ===
${JSON.stringify(recentSales.slice(0, 20).map(s => ({
  invoiceNumber: s.invoice_number,
  date: s.sale_date,
  total: s.total_amount,
  items: s.sale_items?.length || 0,
  paymentStatus: s.payment_status
})), null, 2)}

=== SALE RETURNS (${saleReturns.length}) ===
${JSON.stringify(saleReturns.map(r => ({
  invoiceNumber: r.original_invoice_number,
  product: r.products?.name,
  quantityReturned: r.quantity_returned,
  reason: r.reason,
  status: r.return_status
})), null, 2)}

INSTRUCTIONS:
1. Answer questions accurately using the data above
2. For "Can I produce X?" questions, check the Production Feasibility Analysis
3. For "What's blocking production?" questions, list the blocking materials with quantities needed
4. Use bullet points and clear section headers for clarity
5. Be specific with numbers and quantities
6. If data is missing, clearly state that
7. Calculate totals when asked (e.g., total stock value, total sales)
8. For MRP (Material Requirements Planning) questions, calculate based on BOM data

STOCK STATUS FORMATTING (VERY IMPORTANT):
- For items that are OUT OF STOCK, always use the format: "❌ Out of Stock" or "OUT_OF_STOCK"
- For items that are LOW STOCK, always use the format: "⚠️ Low Stock" or "LOW_STOCK"  
- For items with sufficient stock, use: "✅ OK" or "OK"
- When listing materials or products, always include their stock status clearly

You have FULL ACCESS to:
- ALL Raw Materials (herbs, chemicals)
- ALL Packaging Materials  
- ALL Finished Goods/Products
- ALL Bill of Materials with detailed recipes
- ALL Production batches and their status
- ALL Sales and Returns data

Never say you have limited access. You are a fully system-aware assistant.`;

    } else if (type === "product_helper") {
      // Fetch raw materials for BOM suggestions
      const { data: rawMaterials } = await supabase
        .from("raw_materials")
        .select("*")
        .eq("is_active", true)
        .order("name");
      const { data: existingProducts } = await supabase
        .from("products")
        .select("name, category, description")
        .eq("is_active", true)
        .limit(20);

      systemPrompt = `You are "Gazi Inventory Assistant" - a product development assistant for Gazi Laboratories. Help create product descriptions and suggest Bill of Materials (BOM) based on available raw materials.

Available Raw Materials:
${JSON.stringify(rawMaterials || [], null, 2)}

Existing Products for Reference:
${JSON.stringify(existingProducts || [], null, 2)}

When suggesting BOMs:
1. Use only materials from the available list
2. Suggest realistic quantities per unit
3. Include wastage percentage (typically 2-5%)
4. Consider material categories (herbs, chemicals, packaging)

When creating descriptions:
1. Be professional and suitable for pharmaceutical products
2. Highlight key ingredients and benefits
3. Keep descriptions concise (2-3 sentences)

Return structured JSON when providing BOM suggestions with format:
{
  "description": "Product description text",
  "bomItems": [
    { "rawMaterialId": "uuid", "rawMaterialName": "name", "quantityPerUnit": number, "wastagePercent": number }
  ]
}`;

    } else if (type === "demand_forecast") {
      // Fetch historical sales data for forecasting
      const { data: salesHistory } = await supabase
        .from("sales")
        .select(`
          sale_date,
          total_amount,
          sale_items(quantity, product_id, products(name, category))
        `)
        .order("sale_date", { ascending: false })
        .limit(200);

      const { data: products } = await supabase
        .from("products")
        .select("id, name, category, current_stock, min_stock_level")
        .eq("is_active", true);

      systemPrompt = `You are "Gazi Inventory Assistant" - a demand forecasting analyst for Gazi Laboratories. Analyze sales history to predict future product demand and provide actionable insights.

Historical Sales Data (last 200 orders):
${JSON.stringify(salesHistory || [], null, 2)}

Current Products:
${JSON.stringify(products || [], null, 2)}

Provide forecasts with:
1. Predicted demand for next 7, 30, and 90 days
2. Products that may need restocking soon
3. Seasonal trends or patterns observed
4. Recommendations for production planning
5. Risk assessment (stockout probability)

Format your response with clear sections and use tables or bullet points for clarity. Be specific with numbers when possible.`;

    } else {
      throw new Error("Invalid request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: enrichedPrompt }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response generated";

    console.log("Gazi Inventory Assistant response generated successfully");

    return new Response(
      JSON.stringify({ response: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in ai-assistant function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
