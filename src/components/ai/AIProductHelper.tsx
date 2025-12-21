import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BOMSuggestion {
  rawMaterialId: string;
  rawMaterialName: string;
  quantityPerUnit: number;
  wastagePercent: number;
}

interface AIResponse {
  description?: string;
  bomItems?: BOMSuggestion[];
}

export const AIProductHelper = () => {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [bomSuggestions, setBomSuggestions] = useState<BOMSuggestion[]>([]);
  const [copied, setCopied] = useState(false);
  const { sendMessage, isLoading } = useAIAssistant();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast({
        title: "Product name required",
        description: "Please enter a product name to generate suggestions",
        variant: "destructive",
      });
      return;
    }

    const prompt = `Generate a professional product description and suggest a Bill of Materials (BOM) for the following product:

Product Name: ${productName}
Product Type/Category: ${productType || "General pharmaceutical/nutraceutical"}
Additional Information: ${additionalInfo || "None provided"}

Please provide:
1. A concise, professional product description (2-3 sentences)
2. A suggested BOM using available raw materials with realistic quantities

Return the response as JSON with "description" and "bomItems" fields.`;

    const response = await sendMessage("product_helper", prompt);
    if (response) {
      try {
        // Try to parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed: AIResponse = JSON.parse(jsonMatch[0]);
          if (parsed.description) {
            setGeneratedDescription(parsed.description);
          }
          if (parsed.bomItems && Array.isArray(parsed.bomItems)) {
            setBomSuggestions(parsed.bomItems);
          }
        } else {
          // If no JSON, treat entire response as description
          setGeneratedDescription(response);
        }
      } catch {
        // If parsing fails, use response as description
        setGeneratedDescription(response);
      }
    }
  };

  const handleCopyDescription = async () => {
    await navigator.clipboard.writeText(generatedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Description copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Product Helper
        </CardTitle>
        <CardDescription>
          Generate product descriptions and BOM suggestions using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Immunity Booster Capsules"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productType">Product Type/Category</Label>
            <Input
              id="productType"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g., Capsules, Tablets, Powder"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Additional Information</Label>
          <Textarea
            id="additionalInfo"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Key ingredients, target benefits, any specific requirements..."
            rows={3}
          />
        </div>

        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Suggestions
            </>
          )}
        </Button>

        {generatedDescription && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Generated Description</Label>
              <Button variant="ghost" size="sm" onClick={handleCopyDescription}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm">{generatedDescription}</p>
          </div>
        )}

        {bomSuggestions.length > 0 && (
          <div className="space-y-2">
            <Label className="font-semibold">Suggested BOM</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Raw Material</th>
                    <th className="text-right p-2">Qty/Unit</th>
                    <th className="text-right p-2">Wastage %</th>
                  </tr>
                </thead>
                <tbody>
                  {bomSuggestions.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{item.rawMaterialName}</td>
                      <td className="text-right p-2">{item.quantityPerUnit}</td>
                      <td className="text-right p-2">{item.wastagePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: These are AI suggestions based on available materials. Review and adjust as needed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
