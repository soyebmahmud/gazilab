import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { Send, Bot, User, Loader2, Sparkles, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const AIChatbot = () => {
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm the **Gazi Inventory Assistant**. I have full access to your inventory data including:\n\n• **Raw Materials** - stock levels, categories, suppliers\n• **Packaging Materials** - all packaging inventory\n• **Finished Goods** - products, pricing, stock status\n• **Bill of Materials** - recipes and material requirements\n• **Production** - batch status, feasibility analysis\n• **Sales & Returns** - recent transactions\n\nAsk me anything! For example:\n- \"Do I have enough raw materials to produce 100 units of [Product]?\"\n- \"What materials are blocking production?\"\n- \"What's my current stock status?\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const { sendMessage, isLoading } = useAIAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Add language instruction to the prompt
    const languageInstruction = language === "bn" 
      ? "\n\nIMPORTANT: Please respond in Bengali (বাংলা) language. Use Bengali script for all text."
      : "";
    
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
    "আমার বর্তমান স্টক স্ট্যাটাস কি?",
    "কোন পণ্যগুলোর স্টক কম?",
    "আমি কি ১০০ ইউনিট উৎপাদন করতে পারি?",
    "কোন উপকরণ উৎপাদন ব্লক করছে?",
    "সাম্প্রতিক বিক্রয়ের সারসংক্ষেপ দেখান",
  ] : [
    "What's my current stock status?",
    "Which products are low on stock?",
    "Can I produce 100 units of any product?",
    "What materials are blocking production?",
    "Show me recent sales summary",
    "Any items expiring soon?",
  ];

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Check for stock status indicators and apply colors
      let processedLine = line;
      let lineClass = "";
      
      // OUT OF STOCK - RED
      if (line.includes('OUT_OF_STOCK') || line.includes('Out of Stock') || line.includes('❌') || 
          line.toLowerCase().includes('out of stock') || line.includes('স্টক নেই')) {
        lineClass = "text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded";
        processedLine = processedLine.replace(/OUT_OF_STOCK/g, '❌ Out of Stock');
      }
      // LOW STOCK - YELLOW/ORANGE
      else if (line.includes('LOW_STOCK') || line.includes('Low Stock') || line.includes('⚠️') ||
               line.toLowerCase().includes('low stock') || line.includes('কম স্টক')) {
        lineClass = "text-yellow-600 dark:text-yellow-500 font-medium bg-yellow-500/10 px-2 py-0.5 rounded";
        processedLine = processedLine.replace(/LOW_STOCK/g, '⚠️ Low Stock');
      }
      // OK / Sufficient - can add green optionally
      else if (line.includes('status": "OK"') || line.includes('✅')) {
        lineClass = "text-primary";
      }
      
      // Bold text
      const boldParsed = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Section headers (lines starting with ===)
      if (line.trim().startsWith('===') || line.trim().startsWith('###')) {
        return (
          <div key={i} className="font-semibold text-primary mt-4 mb-2 border-b border-border pb-1">
            {line.replace(/[=#]/g, '').trim()}
          </div>
        );
      }
      
      // Bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <div key={i} className={`ml-4 py-0.5 ${lineClass}`}>
            <span dangerouslySetInnerHTML={{ __html: boldParsed }} />
          </div>
        );
      }
      
      // Numbered items
      if (/^\d+\./.test(line.trim())) {
        return (
          <div key={i} className={`ml-2 py-0.5 ${lineClass}`}>
            <span dangerouslySetInnerHTML={{ __html: boldParsed }} />
          </div>
        );
      }
      
      return (
        <div key={i} className={lineClass}>
          <span dangerouslySetInnerHTML={{ __html: boldParsed }} />
        </div>
      );
    });
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
              <h3 className="text-lg font-semibold">Gazi Inventory Assistant</h3>
              <p className="text-xs text-muted-foreground font-normal">AI-powered inventory insights</p>
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
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.role === "assistant" ? formatMessage(message.content) : message.content}
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
                    <span className="text-sm text-muted-foreground">
                      {language === "bn" ? "চিন্তা করছি..." : "Thinking..."}
                    </span>
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

        {messages.length === 1 && (
          <div className="px-4 pb-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2 pt-3">
              {language === "bn" ? "জিজ্ঞাসা করুন:" : "Try asking:"}
            </p>
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
              placeholder={language === "bn" ? "ইনভেন্টরি, উৎপাদন, বিক্রয় সম্পর্কে জিজ্ঞাসা করুন..." : "Ask about inventory, production, sales..."}
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
