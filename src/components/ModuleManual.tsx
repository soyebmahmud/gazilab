import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ManualSection {
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'success';
}

interface ModuleManualProps {
  title: string;
  description: string;
  sections: ManualSection[];
}

export function ModuleManual({ title, description, sections }: ModuleManualProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type?: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCardClass = (type?: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'success':
        return 'border-primary/30 bg-primary/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-primary/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-medium">
                  📖 {title}
                </CardTitle>
                <Badge variant="outline" className="text-xs">বাংলা ম্যানুয়াল</Badge>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                <HelpCircle className="h-4 w-4" />
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {sections.map((section, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getCardClass(section.type)}`}>
                <div className="flex items-start gap-2">
                  {getIcon(section.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-2">{section.title}</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Pre-defined manuals for each module
export const RAW_MATERIALS_MANUAL = {
  title: "কাঁচামাল ম্যানুয়াল",
  description: "কাঁচামাল যোগ করা, স্টক ম্যানেজমেন্ট এবং ব্যবহার সম্পর্কে জানুন",
  sections: [
    {
      title: "📌 এই মডিউল কি জন্য?",
      content: `কাঁচামাল (Raw Materials) হলো সেই উপাদান যা দিয়ে আপনার প্রোডাক্ট তৈরি হয়।
• ভেষজ (Herbs) - যেমন: আমলকী, হরিতকী
• রাসায়নিক (Chemicals) - যেমন: বাইন্ডার, কোটিং
• প্যাকেজিং (Packaging) - যেমন: বোতল, ক্যাপ, লেবেল`,
      type: 'info' as const
    },
    {
      title: "➕ কাঁচামাল কিভাবে যোগ করবেন?",
      content: `১. "Add Material" বাটনে ক্লিক করুন
২. নাম ও SKU দিন (SKU হলো ইউনিক কোড, যেমন: RM-001)
৩. ক্যাটাগরি সিলেক্ট করুন (herbs/chemicals/packaging)
৪. ইউনিট সিলেক্ট করুন (kg, g, pcs ইত্যাদি)
৫. প্রতি ইউনিট খরচ দিন
৬. মিনিমাম স্টক লেভেল দিন (এই পরিমাণের নিচে গেলে সতর্কতা দেখাবে)
৭. Opening Stock দিন (প্রথমবার যোগ করার সময়)`,
      type: 'success' as const
    },
    {
      title: "📦 স্টক যোগ করা (Receive Stock)",
      content: `• "Receive" বা "Add Stock" বাটনে ক্লিক করুন
• Batch Number দিন (যেমন: BATCH-2025-001)
• পরিমাণ ও প্রতি ইউনিট খরচ দিন
• Expiry Date (ঐচ্ছিক) দিন
• সাপ্লায়ারের নাম দিন

✅ স্টক যোগ হলে Stock Ledger-এ "Purchase" এন্ট্রি হবে`,
      type: 'info' as const
    },
    {
      title: "⚙️ স্টক কমে যায় কখন?",
      content: `• Production শুরু হলে: BOM অনুযায়ী কাঁচামাল স্বয়ংক্রিয়ভাবে কমে যায়
• Adjustment করলে: ম্যানুয়াল স্টক এডজাস্টমেন্ট

⚠️ স্টক শূন্য হলে "Out of Stock" দেখাবে
⚠️ মিনিমাম লেভেলের নিচে গেলে "Low Stock" দেখাবে`,
      type: 'warning' as const
    },
    {
      title: "👁️ Usage দেখা",
      content: `Eye আইকনে ক্লিক করলে দেখতে পাবেন:
• কোন কোন প্রোডাক্টের BOM-এ এই কাঁচামাল ব্যবহৃত হয়
• প্রতিটি প্রোডাক্টে কতটুকু লাগে
• Wastage শতাংশ`,
      type: 'info' as const
    }
  ]
};

export const PRODUCTS_MANUAL = {
  title: "প্রোডাক্ট ম্যানুয়াল",
  description: "প্রোডাক্ট তৈরি, মূল্য নির্ধারণ এবং স্টক ব্যবস্থাপনা",
  sections: [
    {
      title: "📌 এই মডিউল কি জন্য?",
      content: `প্রোডাক্ট হলো আপনার তৈরি/বিক্রয়যোগ্য পণ্য।
• ক্যাপসুল, ট্যাবলেট, পাউডার, লিকুইড, ক্রিম ইত্যাদি
• প্রতিটি প্রোডাক্টের একটি BOM (Bill of Materials) থাকে
• Production সম্পন্ন হলে স্টক বাড়ে`,
      type: 'info' as const
    },
    {
      title: "➕ প্রোডাক্ট কিভাবে যোগ করবেন?",
      content: `১. "Add Product" বাটনে ক্লিক করুন
২. নাম দিন (যেমন: Vitamin C 500mg)
৩. SKU দিন (ইউনিক কোড, যেমন: PROD-001)
৪. Category সিলেক্ট করুন
৫. Cost Price দিন (উৎপাদন খরচ)
৬. Selling Price দিন (বিক্রয় মূল্য)
৭. Units per Pack দিন (যেমন: ১ স্ট্রিপে ১০ ট্যাবলেট)
৮. Min Stock Level দিন

💡 লাভ = Selling Price - Cost Price`,
      type: 'success' as const
    },
    {
      title: "📈 স্টক কিভাবে বাড়ে?",
      content: `স্টক বাড়ে শুধুমাত্র যখন:
✅ Production Batch সম্পন্ন (Complete) হয়
✅ Sales Return করা হয় এবং "Restore to Stock" সিলেক্ট করা হয়
✅ Manual Stock Adjustment (Adjustment In)`,
      type: 'success' as const
    },
    {
      title: "📉 স্টক কিভাবে কমে?",
      content: `স্টক কমে যখন:
• বিক্রয় হয় (Sale)
• Damaged Goods রেকর্ড করা হয়
• Manual Adjustment (Adjustment Out)

⚠️ গুরুত্বপূর্ণ: স্টক শূন্য থাকলে বিক্রয় করা যাবে না!`,
      type: 'warning' as const
    }
  ]
};

export const BOM_MANUAL = {
  title: "বিল অব ম্যাটেরিয়ালস (BOM) ম্যানুয়াল",
  description: "BOM তৈরি, কাঁচামাল লিংক করা এবং উৎপাদনে এর ভূমিকা",
  sections: [
    {
      title: "📌 BOM কি?",
      content: `BOM (Bill of Materials) হলো একটি প্রোডাক্ট তৈরিতে কি কি কাঁচামাল কতটুকু লাগে তার তালিকা।

উদাহরণ: "Vitamin C 500mg" তৈরিতে লাগে:
• Ascorbic Acid - 0.5 gram/unit
• Cellulose - 0.1 gram/unit
• Capsule Shell - 1 pcs/unit

💡 BOM ছাড়া Production করা যায় না!`,
      type: 'info' as const
    },
    {
      title: "➕ BOM কিভাবে তৈরি করবেন?",
      content: `১. "Create BOM" বাটনে ক্লিক করুন
২. যে প্রোডাক্টের জন্য BOM তৈরি করবেন সেটি সিলেক্ট করুন
৩. "Add Material" বাটনে ক্লিক করে কাঁচামাল যোগ করুন:
   • Material সিলেক্ট করুন
   • Qty/Unit দিন (১ ইউনিট প্রোডাক্টে কতটুকু লাগে)
   • Wastage % দিন (উৎপাদনে কতটুকু নষ্ট হয়)
৪. "Create BOM" বাটনে ক্লিক করুন

✅ Est. Manufacturing Cost স্বয়ংক্রিয়ভাবে হিসাব হবে`,
      type: 'success' as const
    },
    {
      title: "🔄 Wastage কিভাবে কাজ করে?",
      content: `Wastage হলো উৎপাদনে যে পরিমাণ কাঁচামাল নষ্ট হয়।

উদাহরণ:
• Qty/Unit = 0.5 gram
• Wastage = 5%
• ১০০ ইউনিট প্রোডাকশনে লাগবে: 0.5 × 100 × 1.05 = 52.5 gram

⚠️ Wastage বেশি হলে Manufacturing Cost বাড়বে`,
      type: 'warning' as const
    },
    {
      title: "🏭 Production-এ BOM-এর ভূমিকা",
      content: `Production শুরু করলে:
✅ BOM অনুযায়ী কাঁচামাল চেক হয় (পর্যাপ্ত আছে কিনা)
✅ Production শুরু হলে কাঁচামাল Reserved হয়
✅ Production সম্পন্ন হলে:
   • কাঁচামাল স্টক কমে যায়
   • Finished Goods স্টক বাড়ে

❌ কাঁচামাল পর্যাপ্ত না থাকলে Production তৈরি করা যাবে না!`,
      type: 'success' as const
    },
    {
      title: "📝 BOM Version",
      content: `• প্রতিটি প্রোডাক্টের একটি Active BOM থাকে
• নতুন ভার্সন তৈরি করলে পুরনো ভার্সন Inactive হয়
• Copy আইকনে ক্লিক করে নতুন ভার্সন তৈরি করতে পারবেন
• পুরনো BOM দিয়ে যে Production হয়েছে তার হিসাব ঠিক থাকবে`,
      type: 'info' as const
    }
  ]
};

export const PRODUCTION_MANUAL = {
  title: "প্রোডাকশন ম্যানুয়াল",
  description: "Production Batch তৈরি, কাঁচামাল ব্যবহার এবং স্টক আপডেট",
  sections: [
    {
      title: "📌 প্রোডাকশন কি?",
      content: `Production হলো কাঁচামাল থেকে Finished Product তৈরির প্রক্রিয়া।

প্রতিটি Production-এর একটি Batch Number থাকে (যেমন: BATCH-2025-001)
এই Batch Number দিয়ে পরে Traceability করা যায়।`,
      type: 'info' as const
    },
    {
      title: "➕ Production Batch কিভাবে তৈরি করবেন?",
      content: `১. "New Batch" বাটনে ক্লিক করুন
২. Product সিলেক্ট করুন (যে প্রোডাক্ট তৈরি করবেন)
   ⚠️ Product-এর Active BOM থাকতে হবে
৩. Quantity (Packs/Strips) দিন
   • System স্বয়ংক্রিয়ভাবে Units হিসাব করবে
   • Material Requirements দেখাবে
৪. Manufacturing Date দিন
৫. Expiry Date দিন
৬. "Create Batch" ক্লিক করুন

❌ কাঁচামাল পর্যাপ্ত না থাকলে Batch তৈরি হবে না!`,
      type: 'success' as const
    },
    {
      title: "🔄 Production Status",
      content: `Production Batch-এর ৪টি Status:

📋 Planned: Batch তৈরি হয়েছে, কাজ শুরু হয়নি
🏃 In Progress: কাজ চলছে, কাঁচামাল Deduct হয়েছে
✅ Completed: কাজ শেষ, Finished Goods Stock-এ যোগ হয়েছে
❌ Cancelled: বাতিল`,
      type: 'info' as const
    },
    {
      title: "▶️ Production শুরু করা (Start)",
      content: `"Start" বাটনে ক্লিক করলে:
✅ Status: Planned → In Progress
✅ BOM অনুযায়ী কাঁচামাল স্টক থেকে Deduct হয়
✅ Stock Ledger-এ "Production Out" এন্ট্রি হয়

⚠️ একবার শুরু করলে কাঁচামাল ফেরত আসবে না!`,
      type: 'warning' as const
    },
    {
      title: "✅ Production সম্পন্ন করা (Complete)",
      content: `"Complete" বাটনে ক্লিক করলে:
✅ উৎপাদিত পরিমাণ জিজ্ঞেস করবে (Planned পরিমাণ বা কম)
✅ Status: In Progress → Completed
✅ Finished Goods Stock বাড়বে
✅ Stock Ledger-এ "Production In" এন্ট্রি হয়

💡 Wastage হলে Planned-এর চেয়ে কম দিতে পারেন`,
      type: 'success' as const
    }
  ]
};

export const STOCK_LEDGER_MANUAL = {
  title: "স্টক লেজার ম্যানুয়াল",
  description: "সকল স্টক মুভমেন্টের হিসাব দেখুন",
  sections: [
    {
      title: "📌 স্টক লেজার কি?",
      content: `Stock Ledger হলো প্রতিটি আইটেমের In/Out-এর সম্পূর্ণ ইতিহাস।
• কখন স্টক এসেছে
• কখন স্টক গেছে
• প্রতিটি লেনদেনের পর Balance কত

এটি আপনার Stock-এর "Bank Statement" এর মতো।`,
      type: 'info' as const
    },
    {
      title: "📊 Movement Types",
      content: `স্টক বাড়ানোর কারণ:
✅ Opening: প্রথম স্টক
✅ Purchase: কেনা
✅ Production In: উৎপাদন সম্পন্ন
✅ Adjustment In: ম্যানুয়াল বৃদ্ধি
✅ Sale Return: বিক্রয় ফেরত

স্টক কমার কারণ:
❌ Sale: বিক্রয়
❌ Production Out: উৎপাদনে ব্যবহার
❌ Adjustment Out: ম্যানুয়াল হ্রাস
❌ Wastage: নষ্ট
❌ Damage Out: ক্ষতিগ্রস্ত`,
      type: 'info' as const
    },
    {
      title: "🔍 কিভাবে ব্যবহার করবেন?",
      content: `১. Products বা Materials ট্যাব সিলেক্ট করুন
২. নির্দিষ্ট আইটেম সিলেক্ট করুন
৩. Date Range দিন (ঐচ্ছিক)
৪. সমস্ত Movement দেখতে পাবেন

💡 Reference দেখে বুঝতে পারবেন কোন Sale বা Production থেকে হয়েছে`,
      type: 'success' as const
    }
  ]
};

export const PURCHASE_ORDERS_MANUAL = {
  title: "পারচেজ অর্ডার ম্যানুয়াল",
  description: "কাঁচামাল ক্রয়ের অর্ডার ম্যানেজমেন্ট",
  sections: [
    {
      title: "📌 পারচেজ অর্ডার কি?",
      content: `Purchase Order (PO) হলো সাপ্লায়ারের কাছ থেকে কাঁচামাল কেনার অর্ডার।
• অর্ডার ট্র্যাক করা
• সাপ্লায়ার ম্যানেজমেন্ট
• Delivery ট্র্যাকিং`,
      type: 'info' as const
    },
    {
      title: "➕ PO কিভাবে তৈরি করবেন?",
      content: `১. "New Order" বাটনে ক্লিক করুন
২. Seller/Supplier সিলেক্ট করুন
৩. কাঁচামাল যোগ করুন:
   • Material সিলেক্ট করুন
   • Quantity দিন
   • Unit Price দিন
৪. Tax % এবং Discount দিন (ঐচ্ছিক)
৫. Expected Delivery Date দিন
৬. "Create Order" ক্লিক করুন`,
      type: 'success' as const
    },
    {
      title: "📦 মাল রিসিভ করা",
      content: `মাল এলে:
✅ "Receive" বাটনে ক্লিক করুন
✅ প্রতিটি আইটেমের Received Quantity দিন
✅ Batch Number দিন
✅ Submit করলে স্টক স্বয়ংক্রিয়ভাবে বাড়বে

⚠️ আংশিক রিসিভ করা যায় (Partial Receive)`,
      type: 'info' as const
    }
  ]
};

export const SALES_MANUAL = {
  title: "বিক্রয় ম্যানুয়াল",
  description: "বিক্রয়, পেমেন্ট এবং বাকি ম্যানেজমেন্ট",
  sections: [
    {
      title: "📌 বিক্রয় মডিউল কি?",
      content: `এখানে প্রোডাক্ট বিক্রয়ের Invoice তৈরি হয়।
• Customer-ভিত্তিক বা Walk-in বিক্রয়
• Batch-ভিত্তিক বিক্রয় (FIFO)
• পেমেন্ট ট্র্যাকিং
• Invoice প্রিন্ট`,
      type: 'info' as const
    },
    {
      title: "➕ বিক্রয় কিভাবে করবেন?",
      content: `১. "New Sale" বাটনে ক্লিক করুন
২. Customer সিলেক্ট করুন (ঐচ্ছিক)
৩. প্রোডাক্ট যোগ করুন:
   • Product সিলেক্ট করুন
   • Batch সিলেক্ট করুন (Expiry-এর কাছাকাছি আগে দেখাবে)
   • Quantity দিন
   • Price স্বয়ংক্রিয়ভাবে আসবে (পরিবর্তন করা যাবে)
   • Discount % দিন (ঐচ্ছিক)
৪. Total Discount ও Tax দিন
৫. "Create Invoice" ক্লিক করুন

✅ স্টক স্বয়ংক্রিয়ভাবে কমবে!`,
      type: 'success' as const
    },
    {
      title: "⚠️ গুরুত্বপূর্ণ বিধিনিষেধ",
      content: `❌ স্টক শূন্য থাকলে বিক্রয় করা যাবে না
❌ Available Stock-এর বেশি বিক্রয় করা যাবে না
❌ শুধুমাত্র "In Stock" প্রোডাক্ট দেখাবে

💡 Batch সিলেক্ট করলে FIFO নিশ্চিত হয় (আগে Expire হবে, আগে বিক্রি)`,
      type: 'warning' as const
    },
    {
      title: "💰 পেমেন্ট ব্যবস্থাপনা",
      content: `Invoice Details-এ গিয়ে:
✅ "Add Payment" বাটনে ক্লিক করুন
✅ Amount, Method (Cash/Bank/bKash/Check) দিন
✅ Payment Date দিন
✅ Submit করুন

Payment Status:
🔴 Unpaid: কোন পেমেন্ট নেই
🟡 Partial: আংশিক পেমেন্ট
🟢 Paid: সম্পূর্ণ পেমেন্ট`,
      type: 'info' as const
    },
    {
      title: "📊 লাভ-ক্ষতি হিসাব",
      content: `লাভ স্বয়ংক্রিয়ভাবে হিসাব হয়:
• বিক্রয় মূল্য - পণ্য খরচ (COGS) = Gross Profit
• Gross Profit - খরচ (Expenses) = Net Profit

Dashboard-এ দেখতে পাবেন:
✅ আজকের নেট লাভ
✅ এই মাসের নেট লাভ
✅ দৈনিক/মাসিক/বাৎসরিক ট্রেন্ড`,
      type: 'success' as const
    }
  ]
};

export const SALES_RETURNS_MANUAL = {
  title: "বিক্রয় ফেরত ম্যানুয়াল",
  description: "পণ্য ফেরত এবং স্টক পুনরুদ্ধার",
  sections: [
    {
      title: "📌 বিক্রয় ফেরত কি?",
      content: `বিক্রি করা পণ্য ফেরত আসলে এখানে প্রসেস হয়।
• Customer Return
• Quality Issue
• Damaged in Transit
• Wrong Product`,
      type: 'info' as const
    },
    {
      title: "🔄 ফেরত কিভাবে প্রসেস করবেন?",
      content: `Sale Details-এ গিয়ে:
১. "Process Return" বাটনে ক্লিক করুন
২. যে Item ফেরত আসছে সেটি সিলেক্ট করুন
৩. Return Quantity দিন
৪. Reason সিলেক্ট করুন
৫. "Restore to Stock" চেক করুন যদি পণ্য ভালো থাকে
৬. Submit করুন`,
      type: 'success' as const
    },
    {
      title: "📦 ফেরত পণ্যের ভবিষ্যত",
      content: `দুটি অপশন আছে:

✅ Restore to Stock: পণ্য ভালো থাকলে
   → সরাসরি Sellable Stock-এ যোগ হবে
   → Stock Ledger-এ "Sale Return" এন্ট্রি হবে

❌ Damaged (Restore না করলে):
   → Damaged Goods-এ যাবে
   → Sellable Stock-এ যাবে না
   → পরে Restore বা Destroy করা যাবে`,
      type: 'info' as const
    }
  ]
};

export const DAMAGED_GOODS_MANUAL = {
  title: "ক্ষতিগ্রস্ত পণ্য ম্যানুয়াল",
  description: "নষ্ট, ক্ষতিগ্রস্ত এবং মেয়াদোত্তীর্ণ পণ্য ব্যবস্থাপনা",
  sections: [
    {
      title: "📌 এই মডিউল কি জন্য?",
      content: `Damaged Goods হলো সেই পণ্য যা বিক্রয়যোগ্য নয়:
• Handling-এ ক্ষতি
• মেয়াদোত্তীর্ণ (Expired)
• Quality Reject
• উৎপাদনে নষ্ট (Manufacturing Wastage)
• Customer Return (ক্ষতিগ্রস্ত)`,
      type: 'info' as const
    },
    {
      title: "➕ Damage কিভাবে রেকর্ড করবেন?",
      content: `১. "Record Damage" বাটনে ক্লিক করুন
২. Product সিলেক্ট করুন
৩. Batch সিলেক্ট করুন (ঐচ্ছিক)
৪. Quantity দিন
৫. Damage Type সিলেক্ট করুন
৬. Notes দিন (ঐচ্ছিক)
৭. Submit করুন

✅ স্টক স্বয়ংক্রিয়ভাবে কমবে!`,
      type: 'success' as const
    },
    {
      title: "🔄 Pending Items নিয়ে কি করবেন?",
      content: `Pending আইটেমের ২টি অপশন:

✅ Restore: পণ্য ঠিক হলে
   → Sellable Stock-এ ফেরত যাবে
   → Stock Ledger-এ "Adjustment In" হবে

🗑️ Destroy: পণ্য পুরোপুরি নষ্ট
   → স্থায়ীভাবে রেকর্ড হবে
   → স্টক আর বাড়বে না`,
      type: 'warning' as const
    },
    {
      title: "📊 Stock Ledger-এ প্রতিফলন",
      content: `সমস্ত Damage স্বয়ংক্রিয়ভাবে Stock Ledger-এ রেকর্ড হয়:
• Damage → "Damage Out" এন্ট্রি
• Restore → "Adjustment In" এন্ট্রি
• Expired → "Expired Out" এন্ট্রি

💡 সব কিছু ট্র্যাকযোগ্য!`,
      type: 'info' as const
    }
  ]
};

export const EXPENSES_MANUAL = {
  title: "খরচ ম্যানুয়াল",
  description: "ব্যবসায়িক খরচ রেকর্ড এবং লাভ-ক্ষতিতে এর প্রভাব",
  sections: [
    {
      title: "📌 খরচ মডিউল কি?",
      content: `এখানে ব্যবসার সকল খরচ রেকর্ড করা হয়:
• বেতন, ভাড়া, বিদ্যুৎ
• পরিবহন, রক্ষণাবেক্ষণ
• মার্কেটিং, অফিস সাপ্লাই
• অন্যান্য খরচ`,
      type: 'info' as const
    },
    {
      title: "➕ খরচ কিভাবে যোগ করবেন?",
      content: `১. "Add Expense" বাটনে ক্লিক করুন
২. Category সিলেক্ট করুন
৩. Amount দিন
৪. Date দিন
৫. Payment Method সিলেক্ট করুন (Cash/Bank)
৬. Bank Account সিলেক্ট করুন (Bank হলে)
৭. Description দিন
৮. Submit করুন

✅ Bank Payment হলে Bank Balance স্বয়ংক্রিয়ভাবে কমবে!`,
      type: 'success' as const
    },
    {
      title: "💰 লাভ-ক্ষতিতে প্রভাব",
      content: `খরচ সরাসরি Net Profit কমায়:

Net Profit = বিক্রয় - পণ্য খরচ (COGS) - খরচ (Expenses)

উদাহরণ:
• আজকের বিক্রয়: ৳50,000
• COGS: ৳30,000
• আজকের খরচ: ৳5,000
• Net Profit: ৳50,000 - ৳30,000 - ৳5,000 = ৳15,000

📊 Dashboard-এ "আজকের নেট লাভ" এবং "এই মাসের নেট লাভ" দেখুন`,
      type: 'success' as const
    },
    {
      title: "📈 Reports-এ দেখুন",
      content: `Reports > আর্থিক (Financial) এ যান:
• Expense Report: তারিখ অনুযায়ী সব খরচ
• Category Report: ক্যাটাগরি অনুযায়ী খরচ
• Profit/Loss Report: সম্পূর্ণ লাভ-ক্ষতি বিবরণী`,
      type: 'info' as const
    }
  ]
};

export const BANK_ACCOUNTS_MANUAL = {
  title: "ব্যাংক একাউন্ট ম্যানুয়াল",
  description: "ব্যাংক একাউন্ট এবং লেনদেন ব্যবস্থাপনা",
  sections: [
    {
      title: "📌 এই মডিউল কি জন্য?",
      content: `ব্যাংক একাউন্ট ম্যানেজমেন্ট:
• Multiple Bank Account ট্র্যাকিং
• Deposit/Withdrawal রেকর্ড
• Balance ট্র্যাকিং
• Transfer between accounts`,
      type: 'info' as const
    },
    {
      title: "➕ একাউন্ট কিভাবে যোগ করবেন?",
      content: `১. "Add Account" বাটনে ক্লিক করুন
২. Account Name দিন
৩. Bank Name দিন
৪. Account Number দিন (ঐচ্ছিক)
৫. Branch দিন (ঐচ্ছিক)
৬. Opening Balance দিন
৭. Submit করুন`,
      type: 'success' as const
    },
    {
      title: "💵 Deposit/Withdrawal",
      content: `একাউন্টে ক্লিক করে:
✅ Deposit: টাকা জমা
✅ Withdrawal: টাকা উত্তোলন

স্বয়ংক্রিয় লেনদেন:
• Expense (Bank Payment) → Withdrawal হয়
• Sale Payment (Bank) → Deposit হয় (যদি সেটাপ করা থাকে)`,
      type: 'info' as const
    },
    {
      title: "📊 Transaction History",
      content: `প্রতিটি একাউন্টের:
• সমস্ত Deposit/Withdrawal দেখা যায়
• Reference (কোন Expense/Sale থেকে হয়েছে)
• Balance After প্রতিটি লেনদেনের পর`,
      type: 'info' as const
    }
  ]
};

export const REPORTS_MANUAL = {
  title: "রিপোর্ট ম্যানুয়াল",
  description: "সকল ব্যবসায়িক রিপোর্ট এবং বিশ্লেষণ",
  sections: [
    {
      title: "📌 রিপোর্ট মডিউল কি?",
      content: `সমস্ত ব্যবসায়িক রিপোর্ট এখানে:
• বিক্রয় রিপোর্ট
• ইনভেন্টরি রিপোর্ট
• আর্থিক রিপোর্ট
• পার্টি রিপোর্ট
• খরচ রিপোর্ট`,
      type: 'info' as const
    },
    {
      title: "📈 বিক্রয় রিপোর্ট",
      content: `• Daily Sales: দৈনিক বিক্রয়
• Product-wise: প্রোডাক্ট অনুযায়ী বিক্রয়
• Customer-wise: কাস্টমার অনুযায়ী বিক্রয়

Date Range সিলেক্ট করে নির্দিষ্ট সময়ের রিপোর্ট দেখুন`,
      type: 'info' as const
    },
    {
      title: "💰 আর্থিক রিপোর্ট",
      content: `Profit & Loss (লাভ-ক্ষতি):
✅ বিক্রয় (Sales)
➖ পণ্য খরচ (COGS)
= Gross Profit
➖ খরচ (Expenses)
= Net Profit

সবকিছু স্বয়ংক্রিয়ভাবে হিসাব হয়!`,
      type: 'success' as const
    },
    {
      title: "📦 ইনভেন্টরি রিপোর্ট",
      content: `• Stock Summary: সব আইটেমের বর্তমান স্টক
• Low Stock: কম স্টক আছে এমন আইটেম
• Stock Valuation: স্টকের মোট মূল্য

💡 PDF Export করতে পারবেন`,
      type: 'info' as const
    },
    {
      title: "👥 পার্টি রিপোর্ট",
      content: `• Customer Statement: কাস্টমারের লেনদেন ইতিহাস
• Seller Statement: সাপ্লায়ারের লেনদেন ইতিহাস
• Outstanding: বাকি আছে এমন পার্টি

Date Range এবং Party সিলেক্ট করে দেখুন`,
      type: 'info' as const
    }
  ]
};

export const CUSTOMERS_MANUAL = {
  title: "কাস্টমার ম্যানুয়াল",
  description: "কাস্টমার তৈরি এবং বাকি ট্র্যাকিং",
  sections: [
    {
      title: "📌 এই মডিউল কি জন্য?",
      content: `কাস্টমার ম্যানেজমেন্ট:
• কাস্টমার তথ্য সংরক্ষণ
• বাকি (Outstanding Balance) ট্র্যাকিং
• বিক্রয় ইতিহাস`,
      type: 'info' as const
    },
    {
      title: "➕ কাস্টমার কিভাবে যোগ করবেন?",
      content: `১. "Add Customer" বাটনে ক্লিক করুন
২. Name দিন (আবশ্যক)
৩. Phone, Email দিন
৪. Address, City, State দিন
৫. GST Number দিন (ঐচ্ছিক)
৬. Submit করুন`,
      type: 'success' as const
    },
    {
      title: "💰 Outstanding Balance",
      content: `Outstanding = মোট বিক্রয় - মোট পেমেন্ট

বাকি বাড়ে:
✅ নতুন বিক্রয় হলে (Unpaid/Partial)

বাকি কমে:
✅ পেমেন্ট রিসিভ করলে
✅ Sales Return হলে`,
      type: 'info' as const
    }
  ]
};

export const SELLERS_MANUAL = {
  title: "সাপ্লায়ার ম্যানুয়াল",
  description: "সাপ্লায়ার/সেলার তৈরি এবং পেমেন্ট ট্র্যাকিং",
  sections: [
    {
      title: "📌 এই মডিউল কি জন্য?",
      content: `সাপ্লায়ার/সেলার ম্যানেজমেন্ট:
• কাঁচামাল সরবরাহকারী
• Purchase Order সংযোগ
• পাওনা (Outstanding) ট্র্যাকিং`,
      type: 'info' as const
    },
    {
      title: "➕ সাপ্লায়ার কিভাবে যোগ করবেন?",
      content: `১. "Add Seller" বাটনে ক্লিক করুন
২. Name দিন (আবশ্যক)
৩. Phone, Email দিন
৪. Address, City, State দিন
৫. GST Number দিন (ঐচ্ছিক)
৬. Submit করুন`,
      type: 'success' as const
    }
  ]
};

export const EXPIRY_ALERTS_MANUAL = {
  title: "মেয়াদ সতর্কতা ম্যানুয়াল",
  description: "মেয়াদোত্তীর্ণ হতে যাওয়া পণ্যের সতর্কতা",
  sections: [
    {
      title: "📌 এই মডিউল কি জন্য?",
      content: `মেয়াদোত্তীর্ণ হতে যাওয়া Batch-এর তালিকা:
• 🔴 Expired: মেয়াদ শেষ
• 🟠 Critical: ৩০ দিনের মধ্যে
• 🟡 Warning: ৬০ দিনের মধ্যে
• 🟢 Info: ৯০ দিনের মধ্যে`,
      type: 'warning' as const
    },
    {
      title: "🎯 কি করবেন?",
      content: `মেয়াদ কাছাকাছি পণ্য:
✅ আগে বিক্রয় করুন (FIFO অনুসরণ করুন)
✅ ডিসকাউন্টে বিক্রয় করুন
✅ মেয়াদ শেষ হলে Damaged Goods-এ রেকর্ড করুন`,
      type: 'info' as const
    }
  ]
};
