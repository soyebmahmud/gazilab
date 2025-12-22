import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { AIProductHelper } from "@/components/ai/AIProductHelper";
import { AIDemandForecast } from "@/components/ai/AIDemandForecast";
import { Bot, Sparkles, TrendingUp } from "lucide-react";

const AIHubPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Hub</h1>
        <p className="text-muted-foreground">
          Gazi Inventory Assistant - AI-powered tools for inventory management
        </p>
      </div>

      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chatbot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Gazi Assistant</span>
            <span className="sm:hidden">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="product" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Product Helper</span>
            <span className="sm:hidden">Products</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Demand Forecast</span>
            <span className="sm:hidden">Forecast</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chatbot" className="mt-6">
          <AIChatbot />
        </TabsContent>

        <TabsContent value="product" className="mt-6">
          <AIProductHelper />
        </TabsContent>

        <TabsContent value="forecast" className="mt-6">
          <AIDemandForecast />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIHubPage;
