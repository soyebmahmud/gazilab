import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { Sparkles, Loader2, Copy, Check, Globe } from "lucide-react";
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
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const { sendMessage, isLoading } = useAIAssistant();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast({
        title: language === "bn" ? "পণ্যের নাম প্রয়োজন" : "Product name required",
        description: language === "bn" 
          ? "সাজেশন তৈরি করতে পণ্যের নাম লিখুন" 
          : "Please enter a product name to generate suggestions",
        variant: "destructive",
      });
      return;
    }

    const englishPrompt = `Generate a professional product description and suggest a Bill of Materials (BOM) for:

Product Name: ${productName}
Product Type/Category: ${productType || "General pharmaceutical/nutraceutical"}
Additional Information: ${additionalInfo || "None provided"}

Provide:
1. A concise, professional product description (2-3 sentences)
2. A suggested BOM using available raw materials with realistic quantities

Return as JSON: {"description": "...", "bomItems": [...]}`;

    const banglaPrompt = `নিম্নলিখিত পণ্যের জন্য পেশাদার বর্ণনা এবং বিল অব ম্যাটেরিয়ালস (BOM) সাজেশন তৈরি করুন:

পণ্যের নাম: ${productName}
পণ্যের ধরন/ক্যাটাগরি: ${productType || "সাধারণ ফার্মাসিউটিক্যাল/নিউট্রাসিউটিক্যাল"}
অতিরিক্ত তথ্য: ${additionalInfo || "দেওয়া হয়নি"}

প্রদান করুন:
1. সংক্ষিপ্ত, পেশাদার পণ্য বর্ণনা (২-৩ বাক্য) - বাংলায়
2. উপলব্ধ কাঁচামাল ব্যবহার করে BOM সাজেশন

JSON হিসেবে রিটার্ন করুন: {"description": "...", "bomItems": [...]}
বর্ণনা বাংলায় লিখুন।`;

    const prompt = language === "bn" ? banglaPrompt : englishPrompt;
    const response = await sendMessage("product_helper", prompt);
    
    if (response) {
      try {
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
          setGeneratedDescription(response);
        }
      } catch {
        setGeneratedDescription(response);
      }
    }
  };

  const handleCopyDescription = async () => {
    await navigator.clipboard.writeText(generatedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: language === "bn" ? "কপি হয়েছে!" : "Copied!",
      description: language === "bn" ? "বর্ণনা ক্লিপবোর্ডে কপি হয়েছে" : "Description copied to clipboard",
    });
  };

  const labels = {
    title: language === "bn" ? "এআই প্রোডাক্ট হেল্পার" : "AI Product Helper",
    description: language === "bn" 
      ? "এআই ব্যবহার করে পণ্যের বর্ণনা এবং BOM সাজেশন তৈরি করুন" 
      : "Generate product descriptions and BOM suggestions using AI",
    productName: language === "bn" ? "পণ্যের নাম *" : "Product Name *",
    productNamePlaceholder: language === "bn" ? "যেমন: ইমিউনিটি বুস্টার ক্যাপসুল" : "e.g., Immunity Booster Capsules",
    productType: language === "bn" ? "পণ্যের ধরন/ক্যাটাগরি" : "Product Type/Category",
    productTypePlaceholder: language === "bn" ? "যেমন: ক্যাপসুল, ট্যাবলেট, পাউডার" : "e.g., Capsules, Tablets, Powder",
    additionalInfo: language === "bn" ? "অতিরিক্ত তথ্য" : "Additional Information",
    additionalInfoPlaceholder: language === "bn" 
      ? "মূল উপাদান, টার্গেট বেনিফিট, বিশেষ প্রয়োজনীয়তা..." 
      : "Key ingredients, target benefits, any specific requirements...",
    generateBtn: language === "bn" ? "সাজেশন তৈরি করুন" : "Generate Suggestions",
    generating: language === "bn" ? "তৈরি হচ্ছে..." : "Generating...",
    generatedDesc: language === "bn" ? "তৈরি বর্ণনা" : "Generated Description",
    suggestedBOM: language === "bn" ? "প্রস্তাবিত BOM" : "Suggested BOM",
    rawMaterial: language === "bn" ? "কাঁচামাল" : "Raw Material",
    qtyUnit: language === "bn" ? "প্রতি ইউনিট পরিমাণ" : "Qty/Unit",
    wastage: language === "bn" ? "অপচয় %" : "Wastage %",
    note: language === "bn" 
      ? "দ্রষ্টব্য: এগুলো উপলব্ধ উপকরণের উপর ভিত্তি করে এআই সাজেশন। প্রয়োজনে পর্যালোচনা ও সমন্বয় করুন।"
      : "Note: These are AI suggestions based on available materials. Review and adjust as needed.",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {labels.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {labels.description}
            </CardDescription>
          </div>
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="product-lang" className="text-xs font-medium cursor-pointer">
              {language === "en" ? "EN" : "বাংলা"}
            </Label>
            <Switch
              id="product-lang"
              checked={language === "bn"}
              onCheckedChange={(checked) => setLanguage(checked ? "bn" : "en")}
              className="scale-75"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="productName">{labels.productName}</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={labels.productNamePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productType">{labels.productType}</Label>
            <Input
              id="productType"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder={labels.productTypePlaceholder}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">{labels.additionalInfo}</Label>
          <Textarea
            id="additionalInfo"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder={labels.additionalInfoPlaceholder}
            rows={3}
          />
        </div>

        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {labels.generating}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {labels.generateBtn}
            </>
          )}
        </Button>

        {generatedDescription && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">{labels.generatedDesc}</Label>
              <Button variant="ghost" size="sm" onClick={handleCopyDescription}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm leading-relaxed">{generatedDescription}</p>
          </div>
        )}

        {bomSuggestions.length > 0 && (
          <div className="space-y-2">
            <Label className="font-semibold">{labels.suggestedBOM}</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">{labels.rawMaterial}</th>
                    <th className="text-right p-3 font-medium">{labels.qtyUnit}</th>
                    <th className="text-right p-3 font-medium">{labels.wastage}</th>
                  </tr>
                </thead>
                <tbody>
                  {bomSuggestions.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.rawMaterialName}</td>
                      <td className="text-right p-3">{item.quantityPerUnit}</td>
                      <td className="text-right p-3">{item.wastagePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              {labels.note}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
