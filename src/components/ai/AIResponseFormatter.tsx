import { ReactNode } from "react";

interface FormattedMessageProps {
  content: string;
}

export const formatAIResponse = (content: string): ReactNode[] => {
  return content.split('\n').map((line, i) => {
    let processedLine = line;
    let lineClass = "";
    
    // OUT OF STOCK - RED with background
    if (line.includes('OUT_OF_STOCK') || line.includes('Out of Stock') || line.includes('❌') || 
        line.toLowerCase().includes('out of stock') || line.includes('স্টক নেই') || line.includes('স্টকআউট')) {
      lineClass = "text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-md my-1 block";
      processedLine = processedLine.replace(/OUT_OF_STOCK/g, '❌ Out of Stock');
    }
    // LOW STOCK - YELLOW/ORANGE with background
    else if (line.includes('LOW_STOCK') || line.includes('Low Stock') || line.includes('⚠️') ||
             line.toLowerCase().includes('low stock') || line.includes('কম স্টক') || line.includes('স্টক কম')) {
      lineClass = "text-yellow-600 dark:text-yellow-500 font-medium bg-yellow-500/10 px-2 py-1 rounded-md my-1 block";
      processedLine = processedLine.replace(/LOW_STOCK/g, '⚠️ Low Stock');
    }
    // CRITICAL / URGENT - Red text
    else if (line.toLowerCase().includes('critical') || line.toLowerCase().includes('urgent') || 
             line.includes('জরুরি') || line.includes('সংকটপূর্ণ')) {
      lineClass = "text-destructive font-medium";
    }
    // OK / Sufficient - Green
    else if (line.includes('status": "OK"') || line.includes('✅') || line.includes('পর্যাপ্ত')) {
      lineClass = "text-primary";
    }
    
    // Bold text conversion
    const boldParsed = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Main section headers (=== or ### or **)
    if (line.trim().startsWith('===') || line.trim().startsWith('###') || 
        (line.trim().startsWith('**') && line.trim().endsWith('**') && !line.includes(':'))) {
      const headerText = line.replace(/[=#*]/g, '').trim();
      return (
        <div key={i} className="font-bold text-base text-primary mt-6 mb-3 pb-2 border-b-2 border-primary/30">
          {headerText}
        </div>
      );
    }
    
    // Sub-headers (numbered with bold like "1. **Header**")
    if (/^\d+\.\s*\*\*/.test(line.trim())) {
      return (
        <div key={i} className="font-semibold text-sm text-foreground mt-4 mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
            {line.match(/^\d+/)?.[0]}
          </span>
          <span dangerouslySetInnerHTML={{ __html: boldParsed.replace(/^\d+\.\s*/, '') }} />
        </div>
      );
    }
    
    // Bullet points with better styling
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
      const bulletContent = line.replace(/^[\s•\-*]+/, '');
      return (
        <div key={i} className={`flex items-start gap-2 ml-4 py-1 ${lineClass}`}>
          <span className="text-primary mt-1">•</span>
          <span dangerouslySetInnerHTML={{ __html: boldParsed.replace(/^[\s•\-*]+/, '') }} />
        </div>
      );
    }
    
    // Numbered items
    if (/^\d+\./.test(line.trim()) && !line.includes('**')) {
      return (
        <div key={i} className={`ml-4 py-1 ${lineClass}`}>
          <span dangerouslySetInnerHTML={{ __html: boldParsed }} />
        </div>
      );
    }
    
    // Empty lines for spacing
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    
    return (
      <div key={i} className={`py-0.5 ${lineClass}`}>
        <span dangerouslySetInnerHTML={{ __html: boldParsed }} />
      </div>
    );
  });
};

export const AIResponseFormatter = ({ content }: FormattedMessageProps) => {
  return <div className="space-y-1">{formatAIResponse(content)}</div>;
};
