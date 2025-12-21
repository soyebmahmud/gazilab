import { forwardRef } from 'react';
import { format } from 'date-fns';
import gaziLogo from '@/assets/gazi-logo.svg';

interface SaleItem {
  id: string;
  product?: { name: string };
  production_batch?: { batch_number: string };
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

interface Sale {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer?: { 
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    gst_number?: string;
  };
  items?: SaleItem[];
  subtotal: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  payment_status: string;
}

interface InvoicePrintProps {
  sale: Sale;
}

export const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ sale }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-black min-h-[297mm] w-[210mm] mx-auto print:p-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={gaziLogo} alt="Gazi Laboratories" className="h-20 w-20" />
            <div>
              <h1 className="text-2xl font-bold text-black">GAZI LABORATORIES LIMITED</h1>
              <p className="text-sm text-gray-600">Quality Healthcare Products</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-black">INVOICE</h2>
            <p className="text-sm font-mono text-black">{sale.invoice_number}</p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-semibold text-black mb-2 border-b border-gray-300 pb-1">Bill To:</h3>
            <p className="font-medium text-black">{sale.customer?.name || 'Walk-in Customer'}</p>
            {sale.customer?.phone && <p className="text-sm text-gray-700">Phone: {sale.customer.phone}</p>}
            {sale.customer?.address && <p className="text-sm text-gray-700">{sale.customer.address}</p>}
            {(sale.customer?.city || sale.customer?.state) && (
              <p className="text-sm text-gray-700">
                {[sale.customer.city, sale.customer.state].filter(Boolean).join(', ')}
              </p>
            )}
            {sale.customer?.gst_number && <p className="text-sm text-gray-700">GST: {sale.customer.gst_number}</p>}
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-black mb-2 border-b border-gray-300 pb-1">Invoice Details:</h3>
            <p className="text-sm text-gray-700">
              <span className="font-medium text-black">Date:</span> {format(new Date(sale.sale_date), 'dd MMMM yyyy')}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium text-black">Status:</span>{' '}
              <span className={sale.payment_status === 'paid' ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>
                {sale.payment_status.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-black">#</th>
              <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-black">Product</th>
              <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-black">Batch</th>
              <th className="border border-gray-300 p-2 text-right text-sm font-semibold text-black">Qty</th>
              <th className="border border-gray-300 p-2 text-right text-sm font-semibold text-black">Unit Price</th>
              <th className="border border-gray-300 p-2 text-right text-sm font-semibold text-black">Disc %</th>
              <th className="border border-gray-300 p-2 text-right text-sm font-semibold text-black">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 text-sm text-black">{index + 1}</td>
                <td className="border border-gray-300 p-2 text-sm font-medium text-black">{item.product?.name}</td>
                <td className="border border-gray-300 p-2 text-sm text-gray-700">{item.production_batch?.batch_number || '-'}</td>
                <td className="border border-gray-300 p-2 text-right text-sm text-black">{item.quantity}</td>
                <td className="border border-gray-300 p-2 text-right text-sm text-black">৳{item.unit_price.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-right text-sm text-black">{item.discount_percent}%</td>
                <td className="border border-gray-300 p-2 text-right text-sm font-medium text-black">৳{item.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-medium text-black">৳{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-700">Discount:</span>
                <span className="font-medium text-red-600">-৳{sale.discount_amount.toFixed(2)}</span>
              </div>
            )}
            {sale.tax_amount > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-700">Tax ({sale.tax_percent}%):</span>
                <span className="font-medium text-black">৳{sale.tax_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-black mt-2">
              <span className="font-bold text-black">Grand Total:</span>
              <span className="font-bold text-lg text-black">৳{sale.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="mb-8 p-3 bg-gray-50 border border-gray-200 rounded">
            <h4 className="text-sm font-semibold text-black mb-1">Notes:</h4>
            <p className="text-sm text-gray-700">{sale.notes}</p>
          </div>
        )}

        {/* Terms & Signature */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-gray-200">
          <div>
            <h4 className="text-sm font-semibold text-black mb-2">Terms & Conditions:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Goods once sold will not be taken back.</li>
              <li>• Payment due within 30 days of invoice date.</li>
              <li>• Subject to jurisdiction of local courts.</li>
            </ul>
          </div>
          <div className="text-right">
            <div className="mt-12 pt-2 border-t border-gray-400 inline-block min-w-[200px]">
              <p className="text-sm font-medium text-black">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm font-semibold text-black">GAZI LABORATORIES LIMITED</p>
          <p className="text-xs text-gray-600 mt-1">Thank you for your business!</p>
          <p className="text-xs text-gray-500 mt-4">Developed by: SOYEB MOHAMMAD ARIF</p>
        </div>
      </div>
    );
  }
);

InvoicePrint.displayName = 'InvoicePrint';
