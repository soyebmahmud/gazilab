// PDF Export utility using browser print
export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: string;
  filename?: string;
}

export function exportToPDF(
  contentRef: HTMLElement | null,
  options: PDFExportOptions
) {
  if (!contentRef) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const styles = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        padding: 20px; 
        color: #1a1a1a;
        font-size: 12px;
      }
      .header { 
        text-align: center; 
        margin-bottom: 20px; 
        padding-bottom: 15px;
        border-bottom: 2px solid #22c55e;
      }
      .header h1 { 
        font-size: 24px; 
        color: #166534;
        margin-bottom: 5px;
      }
      .header .company { 
        font-size: 14px;
        font-weight: bold;
        color: #374151;
        margin-bottom: 3px;
      }
      .header .subtitle { 
        font-size: 12px; 
        color: #6b7280;
      }
      .header .date-range { 
        font-size: 11px; 
        color: #9ca3af;
        margin-top: 5px;
      }
      .header .print-date { 
        font-size: 10px; 
        color: #9ca3af;
        margin-top: 3px;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 10px;
      }
      th, td { 
        border: 1px solid #e5e7eb; 
        padding: 8px 6px; 
        text-align: left;
        font-size: 11px;
      }
      th { 
        background-color: #f3f4f6; 
        font-weight: 600;
        color: #374151;
      }
      tr:nth-child(even) { background-color: #fafafa; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-bold { font-weight: 600; }
      .text-primary { color: #22c55e; }
      .text-destructive { color: #ef4444; }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
      }
      .summary-card {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 10px;
        background-color: #fafafa;
      }
      .summary-card .label { 
        font-size: 10px; 
        color: #6b7280;
        margin-bottom: 3px;
      }
      .summary-card .value { 
        font-size: 16px; 
        font-weight: 600;
        color: #1a1a1a;
      }
      .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 10px;
        color: #9ca3af;
      }
      @media print {
        body { padding: 0; }
        .header { page-break-after: avoid; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      }
    </style>
  `;

  const printDate = new Date().toLocaleString('bn-BD');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${options.title} - Gazi Laboratories</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <div class="company">GAZI LABORATORIES LIMITED</div>
        <h1>${options.title}</h1>
        ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ''}
        ${options.dateRange ? `<div class="date-range">${options.dateRange}</div>` : ''}
        <div class="print-date">প্রিন্ট তারিখ: ${printDate}</div>
      </div>
      ${contentRef.innerHTML}
      <div class="footer">
        <p>Gazi Laboratories Limited - Inventory Management System</p>
        <p>Developed by: SOYEB MOHAMMAD ARIF</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

export function formatCurrencyForPDF(value: number): string {
  return `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}
