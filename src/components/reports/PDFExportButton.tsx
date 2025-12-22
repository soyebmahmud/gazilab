import { useRef, forwardRef, useImperativeHandle, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToPDF, PDFExportOptions } from '@/utils/pdfExport';

interface PDFExportButtonProps {
  title: string;
  subtitle?: string;
  dateRange?: string;
  children: ReactNode;
}

export interface PDFExportRef {
  exportPDF: () => void;
}

export const PDFExportWrapper = forwardRef<PDFExportRef, PDFExportButtonProps>(
  ({ title, subtitle, dateRange, children }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      exportPDF: () => {
        exportToPDF(contentRef.current, { title, subtitle, dateRange });
      },
    }));

    return (
      <div>
        <div ref={contentRef} className="pdf-content">
          {children}
        </div>
      </div>
    );
  }
);

PDFExportWrapper.displayName = 'PDFExportWrapper';

interface PDFButtonWithContentProps {
  title: string;
  subtitle?: string;
  dateRange?: string;
  contentRef: React.RefObject<HTMLDivElement>;
}

export function PDFExportButton({ title, subtitle, dateRange, contentRef }: PDFButtonWithContentProps) {
  const handleExport = () => {
    exportToPDF(contentRef.current, { title, subtitle, dateRange });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      PDF ডাউনলোড
    </Button>
  );
}
