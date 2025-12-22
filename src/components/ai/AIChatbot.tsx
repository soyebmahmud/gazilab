import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { Send, Bot, User, Loader2, Sparkles, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AIResponseFormatter } from "./AIResponseFormatter";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const AIChatbot = () => {
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { sendMessage, isLoading } = useAIAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial welcome message based on language
  useEffect(() => {
    const welcomeEn = `Hello! I'm the **Gazi Inventory Assistant**. I have full access to your complete inventory data:

• **Raw Materials** - all stock levels, categories, suppliers
• **Packaging Materials** - packaging inventory status
• **Finished Goods** - products, pricing, stock levels
• **Bill of Materials** - complete recipes & requirements
• **Production Batches** - status & feasibility analysis
• **Sales & Returns** - all transaction data

Ask me anything! Examples:
- "Do I have enough materials to produce 100 units of [Product]?"
- "What materials are blocking production?"
- "Show me items with low stock"`;

    const welcomeBn = `স্বাগতম! আমি **গাজী ইনভেন্টরি অ্যাসিস্ট্যান্ট**। আমার কাছে সম্পূর্ণ ইনভেন্টরি তথ্যে অ্যাক্সেস আছে:

• **কাঁচামাল** - সব স্টক লেভেল, ক্যাটাগরি, সরবরাহকারী
• **প্যাকেজিং উপকরণ** - প্যাকেজিং ইনভেন্টরি স্ট্যাটাস
• **তৈরি পণ্য** - পণ্য, মূল্য, স্টক লেভেল
• **বিল অব ম্যাটেরিয়ালস** - সম্পূর্ণ রেসিপি ও প্রয়োজনীয়তা
• **প্রোডাকশন ব্যাচ** - স্ট্যাটাস ও সম্ভাব্যতা বিশ্লেষণ
• **বিক্রয় ও রিটার্ন** - সব লেনদেনের তথ্য

যেকোনো প্রশ্ন করুন! উদাহরণ:
- "[পণ্যের] ১০০ ইউনিট উৎপাদনের জন্য পর্যাপ্ত উপকরণ আছে?"
- "কোন উপকরণ উৎপাদন আটকে দিচ্ছে?"
- "স্টক কম আছে এমন আইটেম দেখান"`;

    setMessages([{
      role: "assistant",
      content: language === "bn" ? welcomeBn : welcomeEn,
      timestamp: new Date(),
    }]);
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);

    // Add language instruction to ensure proper formatting and language
    const languageInstruction = language === "bn" 
      ? `\n\nIMPORTANT INSTRUCTIONS:
1. Respond completely in Bengali (বাংলা) language using Bengali script
2. Use clear bullet points and section headers
3. Mark stock status clearly: "স্টক নেই" for OUT_OF_STOCK, "স্টক কম" for LOW_STOCK
4. Keep explanations concise and business-professional
5. Use ❌ for critical issues and ⚠️ for warnings`
      : `\n\nIMPORTANT INSTRUCTIONS:
1. Use clear section headers with ** markers
2. Use bullet points (•) for lists
3. Mark OUT_OF_STOCK items with ❌ and LOW_STOCK with ⚠️
4. Keep each point concise and actionable
5. Be specific with numbers and product names`;
    
    const response = await sendMessage("chatbot", userMessage + languageInstruction);
    if (response) {
      setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: new Date() }]);
    }
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = language === "bn" ? [
    "বর্তমান স্টক স্ট্যাটাস দেখান",
    "কোন পণ্যের স্টক কম?",
    "উৎপাদন ব্লক করছে কোন উপকরণ?",
    "সাম্প্রতিক বিক্রয়ের সারসংক্ষেপ",
    "মেয়াদ শেষ হওয়ার কাছে কোন আইটেম?",
  ] : [
    "Show current stock status",
    "Which products are low on stock?",
    "What materials are blocking production?",
    "Recent sales summary",
    "Any items expiring soon?",
  ];

  const labels = {
    title: language === "bn" ? "গাজী ইনভেন্টরি অ্যাসিস্ট্যান্ট" : "Gazi Inventory Assistant",
    subtitle: language === "bn" ? "এআই-চালিত ইনভেন্টরি ইনসাইটস" : "AI-powered inventory insights",
    placeholder: language === "bn" ? "ইনভেন্টরি, উৎপাদন, বিক্রয় সম্পর্কে জিজ্ঞাসা করুন..." : "Ask about inventory, production, sales...",
    tryAsking: language === "bn" ? "জিজ্ঞাসা করুন:" : "Try asking:",
    thinking: language === "bn" ? "চিন্তা করছি..." : "Thinking...",
  };

  return (
    <Card className="h-[650px] flex flex-col overflow-hidden border-2">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{labels.title}</h3>
              <p className="text-xs text-muted-foreground font-normal">{labels.subtitle}</p>
            </div>
          </CardTitle>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-background/80 px-3 py-2 rounded-lg border">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="language-toggle" className="text-xs font-medium cursor-pointer">
              {language === "en" ? "EN" : "বাংলা"}
            </Label>
            <Switch
              id="language-toggle"
              checked={language === "bn"}
              onCheckedChange={(checked) => setLanguage(checked ? "bn" : "en")}
              className="scale-75"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/80 border border-border/50 rounded-bl-md"
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {message.role === "assistant" ? (
                      <AIResponseFormatter content={message.content} />
                    ) : (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    )}
                  </div>
                  <p className={`text-[10px] mt-2 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">{labels.thinking}</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length <= 1 && (
          <div className="px-4 pb-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2 pt-3">{labels.tryAsking}</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  onClick={() => setInput(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={labels.placeholder}
              disabled={isLoading}
              className="flex-1 h-11 rounded-full px-4 bg-muted/50 border-muted-foreground/20 focus:border-primary"
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-11 w-11 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
