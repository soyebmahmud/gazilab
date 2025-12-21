import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { TrendingUp, Loader2, RefreshCw, BarChart3, AlertTriangle, Calendar } from "lucide-react";

export const AIDemandForecast = () => {
  const [forecast, setForecast] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { sendMessage, isLoading } = useAIAssistant();

  const handleGenerateForecast = async () => {
    const prompt = `Analyze the historical sales data and provide a comprehensive demand forecast including:

1. **Short-term Forecast (Next 7 Days)**
   - Expected sales volume
   - Products likely to be in high demand
   - Any immediate restocking needs

2. **Medium-term Forecast (Next 30 Days)**
   - Sales trend prediction
   - Products that may need production planning
   - Inventory optimization suggestions

3. **Long-term Outlook (Next 90 Days)**
   - Seasonal patterns or trends
   - Strategic inventory recommendations
   - Products to watch

4. **Risk Assessment**
   - Products at risk of stockout
   - Slow-moving inventory concerns
   - Expiry risk analysis

5. **Recommendations**
   - Priority production orders
   - Raw material procurement suggestions
   - Cost optimization opportunities

Please provide specific numbers and product names where possible based on the sales data.`;

    const response = await sendMessage("demand_forecast", prompt);
    if (response) {
      setForecast(response);
      setLastUpdated(new Date());
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Demand Forecasting
            </CardTitle>
            <CardDescription>
              AI-powered analysis of sales history to predict future demand
            </CardDescription>
          </div>
          <Button onClick={handleGenerateForecast} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Forecast
              </>
            )}
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {!forecast && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Forecast Generated</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Click "Generate Forecast" to analyze your sales history and get AI-powered
              predictions for future demand.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">7-Day</p>
                <p className="text-xs text-muted-foreground">Short-term</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">30-Day</p>
                <p className="text-xs text-muted-foreground">Medium-term</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">90-Day</p>
                <p className="text-xs text-muted-foreground">Long-term</p>
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
                    Analyzing sales patterns and generating forecast...
                  </p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-sm">{forecast}</div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
