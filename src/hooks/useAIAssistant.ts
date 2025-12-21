import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (
    type: "chatbot" | "product_helper" | "demand_forecast",
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { type, prompt, context },
      });

      if (error) {
        console.error("AI Assistant error:", error);
        toast({
          title: "AI Error",
          description: error.message || "Failed to get AI response",
          variant: "destructive",
        });
        return null;
      }

      if (data?.error) {
        toast({
          title: "AI Error",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      return data?.response || null;
    } catch (err) {
      console.error("AI Assistant error:", err);
      toast({
        title: "Error",
        description: "Failed to connect to AI service",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
};
