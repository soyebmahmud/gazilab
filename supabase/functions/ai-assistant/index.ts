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
    console.log("AI Assistant request:", { type, prompt: prompt?.substring(0, 100) });

    let systemPrompt = "";
    let enrichedPrompt = prompt;

    // Fetch relevant data based on request type
    if (type === "chatbot") {
      // Fetch inventory data for context
      const { data: stockSummary } = await supabase.rpc("get_stock_summary");
      const { data: expiryAlerts } = await supabase.rpc("get_expiry_alerts", { p_days: 90 });
      const { data: recentSales } = await supabase
        .from("sales")
        .select("*, sale_items(*, products(name))")
        .order("sale_date", { ascending: false })
        .limit(10);
      const { data: productionBatches } = await supabase
        .from("production_batches")
        .select("*, products(name)")
        .order("created_at", { ascending: false })
        .limit(10);

      systemPrompt = `You are an intelligent inventory management assistant for Gazi Laboratories ERP system. You help users understand their stock levels, production batches, sales data, and inventory status.

Current Inventory Summary:
${JSON.stringify(stockSummary?.slice(0, 20) || [], null, 2)}

Expiry Alerts (items expiring within 90 days):
${JSON.stringify(expiryAlerts?.slice(0, 10) || [], null, 2)}

Recent Sales:
${JSON.stringify(recentSales?.slice(0, 5) || [], null, 2)}

Recent Production Batches:
${JSON.stringify(productionBatches?.slice(0, 5) || [], null, 2)}

Provide helpful, accurate answers based on this data. If you don't have specific data, say so. Format responses clearly with bullet points or tables when appropriate. Keep responses concise but informative.`;

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
        .limit(10);

      systemPrompt = `You are a product development assistant for a pharmaceutical/nutraceutical company (Gazi Laboratories). Help create product descriptions and suggest Bill of Materials (BOM) based on available raw materials.

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
        .limit(100);

      const { data: products } = await supabase
        .from("products")
        .select("id, name, category, current_stock, min_stock_level")
        .eq("is_active", true);

      systemPrompt = `You are a demand forecasting analyst for Gazi Laboratories. Analyze sales history to predict future product demand and provide actionable insights.

Historical Sales Data (last 100 orders):
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

    console.log("AI response generated successfully");

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
