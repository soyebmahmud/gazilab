import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { TrendingUp, Loader2, RefreshCw, BarChart3, AlertTriangle, Calendar, Globe } from "lucide-react";
import { AIResponseFormatter } from "./AIResponseFormatter";

export const AIDemandForecast = () => {
  const [forecast, setForecast] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const { sendMessage, isLoading } = useAIAssistant();

  const handleGenerateForecast = async () => {
    const englishPrompt = `Analyze the historical sales data and provide a comprehensive demand forecast. Structure your response with clear sections:

**SHORT-TERM FORECAST (Next 7 Days)**
• Expected sales volume with specific numbers
• Top products likely in high demand
• Immediate restocking priorities (mark LOW_STOCK or OUT_OF_STOCK items)

**MEDIUM-TERM FORECAST (Next 30 Days)**
• Sales trend prediction with percentages
• Products requiring production planning
• Inventory optimization actions needed

**LONG-TERM OUTLOOK (Next 90 Days)**
• Seasonal patterns identified
• Strategic inventory recommendations
• Growth opportunities

**RISK ASSESSMENT**
• Products at stockout risk (mark as ❌ Critical)
• Slow-moving inventory (mark as ⚠️ Warning)
• Expiry concerns

**ACTION ITEMS**
• Priority 1: Urgent tasks
• Priority 2: This week
• Priority 3: This month

Be specific with product names and numbers. Keep each point concise and actionable.`;

    const banglaPrompt = `বিক্রয় তথ্য বিশ্লেষণ করুন এবং চাহিদার পূর্বাভাস দিন। স্পষ্ট বিভাগে সাজান:

**স্বল্পমেয়াদী পূর্বাভাস (আগামী ৭ দিন)**
• প্রত্যাশিত বিক্রয় পরিমাণ সংখ্যা সহ
• উচ্চ চাহিদার পণ্য
• জরুরি পুনঃমজুদ প্রয়োজন (স্টক কম বা স্টক নেই চিহ্নিত করুন)

**মধ্যমেয়াদী পূর্বাভাস (আগামী ৩০ দিন)**
• বিক্রয় প্রবণতা শতাংশ সহ
• উৎপাদন পরিকল্পনা প্রয়োজন এমন পণ্য
• ইনভেন্টরি অপ্টিমাইজেশন পদক্ষেপ

**দীর্ঘমেয়াদী দৃষ্টিভঙ্গি (আগামী ৯০ দিন)**
• মৌসুমী প্যাটার্ন
• কৌশলগত সুপারিশ
• বৃদ্ধির সুযোগ

**ঝুঁকি মূল্যায়ন**
• স্টকআউট ঝুঁকিতে থাকা পণ্য (❌ সংকটপূর্ণ হিসেবে চিহ্নিত)
• ধীরগতির ইনভেন্টরি (⚠️ সতর্কতা হিসেবে চিহ্নিত)
• মেয়াদ উত্তীর্ণের উদ্বেগ

**কর্মপরিকল্পনা**
• অগ্রাধিকার ১: জরুরি কাজ
• অগ্রাধিকার ২: এই সপ্তাহে
• অগ্রাধিকার ৩: এই মাসে

পণ্যের নাম ও সংখ্যা নির্দিষ্ট করুন। প্রতিটি পয়েন্ট সংক্ষিপ্ত ও কার্যকর রাখুন। সম্পূর্ণ বাংলায় উত্তর দিন।`;

    const prompt = language === "bn" ? banglaPrompt : englishPrompt;
    const response = await sendMessage("demand_forecast", prompt);
    if (response) {
      setForecast(response);
      setLastUpdated(new Date());
    }
  };

  const labels = {
    title: language === "bn" ? "এআই চাহিদা পূর্বাভাস" : "AI Demand Forecasting",
    description: language === "bn" 
      ? "বিক্রয় ইতিহাস বিশ্লেষণ করে ভবিষ্যত চাহিদার পূর্বাভাস" 
      : "AI-powered analysis of sales history to predict future demand",
    generateBtn: language === "bn" ? "পূর্বাভাস তৈরি করুন" : "Generate Forecast",
    analyzing: language === "bn" ? "বিশ্লেষণ করা হচ্ছে..." : "Analyzing...",
    noForecast: language === "bn" ? "কোনো পূর্বাভাস তৈরি হয়নি" : "No Forecast Generated",
    noForecastDesc: language === "bn" 
      ? "বিক্রয় ইতিহাস বিশ্লেষণ করতে এবং ভবিষ্যত চাহিদার পূর্বাভাস পেতে \"পূর্বাভাস তৈরি করুন\" ক্লিক করুন।"
      : "Click \"Generate Forecast\" to analyze your sales history and get AI-powered predictions for future demand.",
    shortTerm: language === "bn" ? "৭ দিন" : "7-Day",
    shortTermLabel: language === "bn" ? "স্বল্পমেয়াদী" : "Short-term",
    mediumTerm: language === "bn" ? "৩০ দিন" : "30-Day",
    mediumTermLabel: language === "bn" ? "মধ্যমেয়াদী" : "Medium-term",
    longTerm: language === "bn" ? "৯০ দিন" : "90-Day",
    longTermLabel: language === "bn" ? "দীর্ঘমেয়াদী" : "Long-term",
    lastUpdated: language === "bn" ? "সর্বশেষ আপডেট:" : "Last updated:",
    analyzingPatterns: language === "bn" 
      ? "বিক্রয় প্যাটার্ন বিশ্লেষণ করা হচ্ছে এবং পূর্বাভাস তৈরি করা হচ্ছে..."
      : "Analyzing sales patterns and generating forecast...",
  };

  return (
    <Card className="h-[650px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {labels.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {labels.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="forecast-lang" className="text-xs font-medium cursor-pointer">
                {language === "en" ? "EN" : "বাংলা"}
              </Label>
              <Switch
                id="forecast-lang"
                checked={language === "bn"}
                onCheckedChange={(checked) => setLanguage(checked ? "bn" : "en")}
                className="scale-75"
              />
            </div>
            <Button onClick={handleGenerateForecast} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {labels.analyzing}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {labels.generateBtn}
                </>
              )}
            </Button>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-2">
            {labels.lastUpdated} {lastUpdated.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {!forecast && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{labels.noForecast}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {labels.noForecastDesc}
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">{labels.shortTerm}</p>
                <p className="text-xs text-muted-foreground">{labels.shortTermLabel}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">{labels.mediumTerm}</p>
                <p className="text-xs text-muted-foreground">{labels.mediumTermLabel}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">{labels.longTerm}</p>
                <p className="text-xs text-muted-foreground">{labels.longTermLabel}</p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {labels.analyzingPatterns}
                  </p>
                </div>
              ) : (
                <div className="text-sm">
                  <AIResponseFormatter content={forecast || ""} />
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
