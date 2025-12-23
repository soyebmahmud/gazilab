import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, Package, Factory, ShoppingCart, RotateCcw, 
  AlertTriangle, Wallet, Building2, BarChart3, Users, 
  Truck, Clock, Database, Settings, CheckCircle2, Info,
  Box, Beaker, FileText, Calculator, TrendingUp, Shield
} from 'lucide-react';

// Section component for consistent styling
function ManualSection({ 
  title, 
  children, 
  type = 'info' 
}: { 
  title: string; 
  children: React.ReactNode; 
  type?: 'info' | 'warning' | 'success' | 'danger';
}) {
  const styles = {
    info: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    danger: 'border-destructive/30 bg-destructive/5',
  };

  const icons = {
    info: <Info className="h-4 w-4 text-blue-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    danger: <AlertTriangle className="h-4 w-4 text-destructive" />,
  };

  return (
    <div className={`p-4 rounded-lg border ${styles[type]} mb-4`}>
      <div className="flex items-start gap-2">
        {icons[type]}
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-2">{title}</h4>
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Module Card component
function ModuleCard({ 
  icon, 
  title, 
  description, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export default function UserManualPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">📖 সম্পূর্ণ ব্যবহারকারী ম্যানুয়াল</h1>
            <p className="text-muted-foreground">গাজী ল্যাবরেটরীজ ERP সিস্টেম - বাংলা নির্দেশিকা</p>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card className="bg-accent/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">⚡ দ্রুত নেভিগেশন</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">কাঁচামাল</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">BOM</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">প্যাকেজিং</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">প্রোডাক্ট</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">প্রোডাকশন</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">বিক্রয়</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">রিটার্ন</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">ড্যামেজ</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">স্টক লেজার</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">খরচ</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">রিপোর্ট</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview">সারসংক্ষেপ</TabsTrigger>
            <TabsTrigger value="materials">কাঁচামাল</TabsTrigger>
            <TabsTrigger value="bom">BOM ও প্যাকেজিং</TabsTrigger>
            <TabsTrigger value="production">প্রোডাকশন</TabsTrigger>
            <TabsTrigger value="sales">বিক্রয়</TabsTrigger>
            <TabsTrigger value="returns">রিটার্ন ও ড্যামেজ</TabsTrigger>
            <TabsTrigger value="finance">অর্থনৈতিক</TabsTrigger>
            <TabsTrigger value="reports">রিপোর্ট</TabsTrigger>
            <TabsTrigger value="flows">কর্মপ্রবাহ</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <ModuleCard
              icon={<Database className="h-5 w-5 text-primary" />}
              title="সিস্টেম সারসংক্ষেপ"
              description="ERP সিস্টেমের মূল ধারণা এবং কার্যপ্রণালী"
            >
              <ManualSection title="🎯 এই ERP সিস্টেম কি জন্য?" type="info">
                {`এই সিস্টেম ফার্মাসিউটিক্যাল উৎপাদন ব্যবসার সম্পূর্ণ ব্যবস্থাপনার জন্য তৈরি:

• কাঁচামাল (Raw Materials) ক্রয় ও স্টক ব্যবস্থাপনা
• প্রোডাক্ট রেসিপি (BOM - Bill of Materials) তৈরি
• উৎপাদন ব্যাচ ম্যানেজমেন্ট ও ট্রেসেবিলিটি
• ৩-স্তরের প্যাকেজিং ক্যালকুলেশন (Strip → Box → Carton)
• বিক্রয় ও ইনভয়েস ব্যবস্থাপনা
• পেমেন্ট ট্র্যাকিং (পূর্ণ/আংশিক/বাকি)
• রিটার্ন ও ড্যামেজ প্রসেসিং
• লাভ-ক্ষতি হিসাব ও রিপোর্টিং`}
              </ManualSection>

              <ManualSection title="🔄 মূল কর্মপ্রবাহ (সংক্ষেপে)" type="success">
                {`ধাপ ১: কাঁচামাল যোগ করুন (Raw Materials → Add Material)
ধাপ ২: কাঁচামাল স্টক রিসিভ করুন (Receive Stock)
ধাপ ৩: প্রোডাক্ট তৈরি করুন (Products → Add Product)
ধাপ ৪: প্যাকেজিং কনফিগ সেট করুন (Packaging Config)
ধাপ ৫: BOM তৈরি করুন (BOM → Create BOM)
ধাপ ৬: প্রোডাকশন ব্যাচ তৈরি করুন (Production → New Batch)
ধাপ ৭: প্রোডাকশন শুরু করুন (Start) → সম্পন্ন করুন (Complete)
ধাপ ৮: বিক্রয় করুন (Sales → New Sale)
ধাপ ৯: পেমেন্ট রিসিভ করুন (Add Payment)
ধাপ ১০: রিপোর্ট দেখুন (Reports)`}
              </ManualSection>

              <ManualSection title="⚠️ গুরুত্বপূর্ণ নিয়ম" type="warning">
                {`❌ BOM ছাড়া প্রোডাকশন করা যায় না
❌ স্টক শূন্য থাকলে বিক্রয় করা যায় না
❌ কাঁচামাল পর্যাপ্ত না থাকলে প্রোডাকশন শুরু করা যায় না
❌ একবার প্রোডাকশন শুরু হলে কাঁচামাল ফেরত আসে না

✅ সবকিছু Stock Ledger-এ ট্র্যাক হয়
✅ Batch Number দিয়ে সম্পূর্ণ ট্রেসেবিলিটি সম্ভব
✅ FIFO (First In First Out) অনুসরণ করা হয়`}
              </ManualSection>
            </ModuleCard>
          </TabsContent>

          {/* Raw Materials Tab */}
          <TabsContent value="materials" className="mt-6">
            <ModuleCard
              icon={<Package className="h-5 w-5 text-primary" />}
              title="কাঁচামাল (Raw Materials)"
              description="কাঁচামাল যোগ করা, স্টক ম্যানেজমেন্ট এবং ব্যবহার"
            >
              <ManualSection title="📌 কাঁচামাল কি?" type="info">
                {`কাঁচামাল হলো সেই উপাদান যা দিয়ে আপনার প্রোডাক্ট তৈরি হয়। তিন ধরনের কাঁচামাল আছে:

🌿 ভেষজ (Herbs): আমলকী, হরিতকী, বহেড়া, তুলসী ইত্যাদি
🧪 রাসায়নিক (Chemicals): বাইন্ডার, কোটিং, প্রিজার্ভেটিভ ইত্যাদি
📦 প্যাকেজিং (Packaging): স্ট্রিপ, বোতল, বক্স, কার্টন, লেবেল ইত্যাদি

💡 প্রতিটি কাঁচামালের একটি ইউনিক SKU থাকে (যেমন: RM-HERB-001)`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-material">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ নতুন কাঁচামাল কিভাবে যোগ করবেন?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "Add Material" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> নাম দিন (যেমন: Ascorbic Acid)</p>
                      <p><strong>ধাপ ৩:</strong> SKU দিন (যেমন: RM-CHEM-001) - এটি ইউনিক হতে হবে</p>
                      <p><strong>ধাপ ৪:</strong> ক্যাটাগরি সিলেক্ট করুন (herbs/chemicals/packaging)</p>
                      <p><strong>ধাপ ৫:</strong> ইউনিট সিলেক্ট করুন (kg, g, l, ml, pcs, box, pack)</p>
                      <p><strong>ধাপ ৬:</strong> প্রতি ইউনিট খরচ দিন (Cost per Unit)</p>
                      <p><strong>ধাপ ৭:</strong> মিনিমাম স্টক লেভেল দিন (এই পরিমাণের নিচে গেলে Warning দেখাবে)</p>
                      <p><strong>ধাপ ৮:</strong> Opening Stock দিন (প্রথমবার যোগ করার সময়)</p>
                      <p><strong>ধাপ ৯:</strong> সাপ্লায়ারের নাম দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ১০:</strong> "Create" বাটনে ক্লিক করুন</p>
                      
                      <div className="mt-3 p-3 bg-green-500/10 rounded-lg">
                        <p className="text-green-600">✅ সফলভাবে তৈরি হলে:</p>
                        <p>• কাঁচামাল তালিকায় যোগ হবে</p>
                        <p>• Opening Stock থাকলে Stock Ledger-এ "Opening" এন্ট্রি হবে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="receive-stock">
                  <AccordionTrigger className="text-sm font-medium">
                    📦 স্টক রিসিভ করা (নতুন ব্যাচ যোগ)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> কাঁচামালের সারিতে "Receive" বা "Add Stock" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> Batch Number দিন (যেমন: BATCH-2025-JAN-001)</p>
                      <p><strong>ধাপ ৩:</strong> পরিমাণ দিন (Quantity Received)</p>
                      <p><strong>ধাপ ৪:</strong> প্রতি ইউনিট খরচ দিন (Cost per Unit)</p>
                      <p><strong>ধাপ ৫:</strong> Expiry Date দিন (ঐচ্ছিক - ভেষজ/রাসায়নিকের জন্য)</p>
                      <p><strong>ধাপ ৬:</strong> সাপ্লায়ারের নাম দিন</p>
                      <p><strong>ধাপ ৭:</strong> নোট দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৮:</strong> "Add Stock" বাটনে ক্লিক করুন</p>
                      
                      <div className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                        <p className="text-blue-600">📊 অটোমেটিক প্রভাব:</p>
                        <p>• কাঁচামালের Current Stock বাড়বে</p>
                        <p>• Stock Ledger-এ "Purchase" এন্ট্রি হবে</p>
                        <p>• নতুন Batch তৈরি হবে (FIFO-এর জন্য)</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="stock-deduction">
                  <AccordionTrigger className="text-sm font-medium">
                    ⚙️ স্টক কমে যায় কখন? (অটোমেটিক)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="font-medium mb-2">স্টক স্বয়ংক্রিয়ভাবে কমে যায় যখন:</p>
                        <p>🏭 <strong>প্রোডাকশন শুরু হয়:</strong> BOM অনুযায়ী কাঁচামাল Deduct হয়</p>
                        <p className="ml-4 text-muted-foreground">→ Stock Ledger-এ "Production Out" এন্ট্রি হয়</p>
                        
                        <p className="mt-2">🔧 <strong>ম্যানুয়াল Adjustment:</strong> Stock Ledger থেকে "Adjustment Out"</p>
                      </div>
                      
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg">
                        <p className="text-yellow-600">⚠️ সতর্কতা Status:</p>
                        <p>🔴 <strong>Out of Stock:</strong> Current Stock = 0</p>
                        <p>🟡 <strong>Low Stock:</strong> Current Stock ≤ Min Stock Level</p>
                        <p>🟢 <strong>In Stock:</strong> পর্যাপ্ত স্টক আছে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="view-usage">
                  <AccordionTrigger className="text-sm font-medium">
                    👁️ Usage দেখা (কোথায় ব্যবহৃত হচ্ছে)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>Eye (👁️) আইকনে ক্লিক করলে দেখতে পাবেন:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>কোন কোন প্রোডাক্টের BOM-এ এই কাঁচামাল ব্যবহৃত হয়</li>
                        <li>প্রতিটি প্রোডাক্টে কতটুকু লাগে (Qty/Unit)</li>
                        <li>Wastage শতাংশ</li>
                      </ul>
                      
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg">
                        <p className="text-yellow-600">⚠️ ডিলিট সংক্রান্ত:</p>
                        <p>যদি কাঁচামাল কোন BOM-এ ব্যবহৃত হয় বা Stock Ledger-এ এন্ট্রি থাকে, তাহলে Delete করলে এটি "Soft Delete" হবে (Inactive হবে, সম্পূর্ণ মুছবে না)।</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="deleted-restore">
                  <AccordionTrigger className="text-sm font-medium">
                    🗑️ ডিলিট করা কাঁচামাল পুনরুদ্ধার (Restore)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "Deleted (X)" বাটনে ক্লিক করুন (X = ডিলিট করা সংখ্যা)</p>
                      <p><strong>ধাপ ২:</strong> ডিলিট করা কাঁচামালের তালিকা দেখতে পাবেন</p>
                      <p><strong>ধাপ ৩:</strong> পুনরুদ্ধার করতে "Restore" (↩️) বাটনে ক্লিক করুন</p>
                      
                      <div className="mt-3 p-3 bg-green-500/10 rounded-lg">
                        <p className="text-green-600">✅ Restore করলে:</p>
                        <p>• কাঁচামাল আবার Active তালিকায় আসবে</p>
                        <p>• আগের সমস্ত স্টক ও হিস্টোরি বজায় থাকবে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>

            {/* Products */}
            <ModuleCard
              icon={<Box className="h-5 w-5 text-primary" />}
              title="প্রোডাক্ট (Finished Goods)"
              description="প্রোডাক্ট তৈরি, মূল্য নির্ধারণ এবং স্টক ব্যবস্থাপনা"
            >
              <ManualSection title="📌 প্রোডাক্ট কি?" type="info">
                {`প্রোডাক্ট হলো আপনার তৈরি/বিক্রয়যোগ্য পণ্য যা কাঁচামাল থেকে উৎপাদন করা হয়।

• ক্যাপসুল, ট্যাবলেট, পাউডার, লিকুইড, সিরাপ, ক্রিম ইত্যাদি
• প্রতিটি প্রোডাক্টের একটি BOM (রেসিপি) থাকে
• Production সম্পন্ন হলে স্টক বাড়ে
• বিক্রয় হলে স্টক কমে`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-product">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ নতুন প্রোডাক্ট কিভাবে যোগ করবেন?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "Add Product" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> নাম দিন (যেমন: Vitamin C 500mg Capsule)</p>
                      <p><strong>ধাপ ৩:</strong> SKU দিন (যেমন: PROD-VITC-500)</p>
                      <p><strong>ধাপ ৪:</strong> Category সিলেক্ট করুন (capsules/tablets/powder/liquid/cream/other)</p>
                      <p><strong>ধাপ ৫:</strong> Dosage Form সিলেক্ট করুন (tablet/capsule/syrup ইত্যাদি)</p>
                      <p><strong>ধাপ ৬:</strong> Strength দিন (যেমন: 500mg)</p>
                      <p><strong>ধাপ ৭:</strong> Cost Price দিন (উৎপাদন খরচ প্রতি ইউনিট)</p>
                      <p><strong>ধাপ ৮:</strong> Selling Price দিন (বিক্রয় মূল্য প্রতি ইউনিট)</p>
                      <p><strong>ধাপ ৯:</strong> Min Stock Level দিন</p>
                      <p><strong>ধাপ ১০:</strong> Shelf Life (মাস) দিন - Expiry হিসাবের জন্য</p>
                      
                      <div className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                        <p className="text-blue-600">💡 মনে রাখবেন:</p>
                        <p>• লাভ = Selling Price - Cost Price</p>
                        <p>• প্রোডাক্ট তৈরির পর Packaging Config সেট করুন</p>
                        <p>• তারপর BOM তৈরি করুন</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="packaging-config">
                  <AccordionTrigger className="text-sm font-medium">
                    📦 প্যাকেজিং কনফিগারেশন সেট করা
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>প্রোডাক্ট তালিকায় "Packaging" (📦) বাটনে ক্লিক করুন।</p>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">৩-স্তরের প্যাকেজিং স্ট্রাকচার:</p>
                        <p className="mt-2">🔵 <strong>Primary (প্রাইমারি):</strong> সরাসরি পণ্য ধারণকারী</p>
                        <p className="ml-4">যেমন: Strip, Blister, Bottle, Vial</p>
                        <p className="ml-4">→ Units per Primary Pack: ১০ (১ স্ট্রিপে ১০ ট্যাবলেট)</p>
                        
                        <p className="mt-2">🟠 <strong>Secondary (সেকেন্ডারি):</strong> প্রাইমারি প্যাকের বাক্স</p>
                        <p className="ml-4">যেমন: Box (ছোট বাক্স)</p>
                        <p className="ml-4">→ Primary Packs per Secondary: ১০ (১ বক্সে ১০ স্ট্রিপ)</p>
                        
                        <p className="mt-2">🟣 <strong>Tertiary (টারশিয়ারি):</strong> শিপিং কার্টন</p>
                        <p className="ml-4">যেমন: Carton, Shipper</p>
                        <p className="ml-4">→ Secondary Packs per Tertiary: ১২ (১ কার্টনে ১২ বক্স)</p>
                      </div>
                      
                      <div className="mt-3 p-3 bg-green-500/10 rounded-lg">
                        <p className="text-green-600">✅ উদাহরণ ক্যালকুলেশন:</p>
                        <p>১ কার্টন = ১২ বক্স × ১০ স্ট্রিপ × ১০ ট্যাবলেট = <strong>১,২০০ ইউনিট</strong></p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="stock-changes">
                  <AccordionTrigger className="text-sm font-medium">
                    📈 স্টক কিভাবে বাড়ে/কমে?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <p className="font-medium text-green-600 mb-2">স্টক বাড়ে যখন:</p>
                        <p>✅ Production Batch সম্পন্ন (Complete) হয়</p>
                        <p>✅ Sales Return করা হয় এবং "Restore to Stock" সিলেক্ট করা হয়</p>
                        <p>✅ Stock Ledger থেকে "Adjustment In" করা হয়</p>
                      </div>
                      
                      <div className="p-3 bg-red-500/10 rounded-lg">
                        <p className="font-medium text-red-600 mb-2">স্টক কমে যখন:</p>
                        <p>❌ বিক্রয় হয় (Sale)</p>
                        <p>❌ Damaged Goods রেকর্ড করা হয়</p>
                        <p>❌ Stock Ledger থেকে "Adjustment Out" করা হয়</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>
          </TabsContent>

          {/* BOM & Packaging Tab */}
          <TabsContent value="bom" className="mt-6">
            <ModuleCard
              icon={<FileText className="h-5 w-5 text-primary" />}
              title="বিল অব ম্যাটেরিয়ালস (BOM)"
              description="প্রোডাক্টের রেসিপি - কি কাঁচামাল কতটুকু লাগে"
            >
              <ManualSection title="📌 BOM কি?" type="info">
                {`BOM (Bill of Materials) হলো একটি প্রোডাক্ট তৈরিতে কি কি কাঁচামাল কতটুকু লাগে তার সম্পূর্ণ তালিকা। এটি প্রোডাকশনের "রেসিপি"।

উদাহরণ - "Vitamin C 500mg Capsule" তৈরিতে লাগে:
• Ascorbic Acid - ০.৫ gram/unit (API/Excipient লেয়ার)
• Capsule Shell - ১ pcs/unit (Primary Packaging)
• Strip Foil - ০.০১ pcs/unit (Primary Packaging)
• Box - ০.১ pcs/unit (Secondary Packaging)
• Carton - ০.০০৮৩ pcs/unit (Tertiary Packaging)

💡 BOM ছাড়া Production করা যায় না!`}
              </ManualSection>

              <ManualSection title="🏗️ হায়ারার্কিক্যাল BOM স্ট্রাকচার" type="success">
                {`BOM ৪টি লেয়ারে বিভক্ত:

🔵 API/Excipient (সক্রিয় উপাদান):
   → ইউনিট অনুযায়ী স্কেল হয়
   → যেমন: ১০০০ ইউনিট = ১০০০ × Qty/Unit

🟢 Primary Packaging (প্রাইমারি প্যাকেজিং):
   → Primary Pack সংখ্যা অনুযায়ী স্কেল হয়
   → যেমন: ১০০০ ইউনিট = ১০০ স্ট্রিপ → ১০০ × Qty

🟠 Secondary Packaging (সেকেন্ডারি প্যাকেজিং):
   → Secondary Pack (Box) সংখ্যা অনুযায়ী স্কেল হয়
   → যেমন: ১০০ স্ট্রিপ = ১০ বক্স → ১০ × Qty

🟣 Tertiary Packaging (টারশিয়ারি প্যাকেজিং):
   → Tertiary Pack (Carton) সংখ্যা অনুযায়ী স্কেল হয়
   → যেমন: ১০ বক্স = ১ কার্টন → ১ × Qty`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="create-bom">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ BOM কিভাবে তৈরি করবেন? (Step-by-Step)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> BOM পেজে যান এবং "Create BOM" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> যে প্রোডাক্টের জন্য BOM তৈরি করবেন সেটি সিলেক্ট করুন</p>
                      <p className="ml-4 text-muted-foreground">(শুধুমাত্র BOM নেই এমন প্রোডাক্ট দেখাবে)</p>
                      <p><strong>ধাপ ৩:</strong> নোট দিন (ঐচ্ছিক - এই ভার্সনের বিবরণ)</p>
                      
                      <div className="p-3 bg-accent rounded-lg my-2">
                        <p className="font-medium">ধাপ ৪: প্রতিটি লেয়ারে কাঁচামাল যোগ করুন:</p>
                        
                        <p className="mt-2 font-medium">🔵 API/Excipient লেয়ার:</p>
                        <p>• "API" ট্যাবে ক্লিক করুন</p>
                        <p>• "যোগ করুন" বাটনে ক্লিক করুন</p>
                        <p>• কাঁচামাল সিলেক্ট করুন (herbs/chemicals দেখাবে)</p>
                        <p>• Qty/Unit দিন (১ ইউনিট প্রোডাক্টে কতটুকু লাগে)</p>
                        <p>• Wastage % দিন (উৎপাদনে কত % নষ্ট হয়)</p>
                        
                        <p className="mt-2 font-medium">🟢 Primary Packaging:</p>
                        <p>• "Primary" ট্যাবে ক্লিক করুন</p>
                        <p>• প্যাকেজিং ম্যাটেরিয়াল যোগ করুন</p>
                        <p>• যেমন: Strip Foil - ১ pcs per primary pack</p>
                        
                        <p className="mt-2 font-medium">🟠 Secondary/🟣 Tertiary:</p>
                        <p>• একইভাবে Box, Carton ইত্যাদি যোগ করুন</p>
                      </div>
                      
                      <p><strong>ধাপ ৫:</strong> "BOM তৈরি করুন" বাটনে ক্লিক করুন</p>
                      
                      <div className="mt-3 p-3 bg-green-500/10 rounded-lg">
                        <p className="text-green-600">✅ BOM তৈরি হলে:</p>
                        <p>• Est. Manufacturing Cost স্বয়ংক্রিয়ভাবে হিসাব হবে</p>
                        <p>• এই প্রোডাক্টে এখন Production করা যাবে</p>
                        <p>• ভার্সন নম্বর: v1</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="wastage">
                  <AccordionTrigger className="text-sm font-medium">
                    🔄 Wastage কিভাবে কাজ করে?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>Wastage হলো উৎপাদন প্রক্রিয়ায় যে পরিমাণ কাঁচামাল নষ্ট/অপচয় হয়।</p>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">উদাহরণ ক্যালকুলেশন:</p>
                        <p>• Qty/Unit = ০.৫ gram</p>
                        <p>• Wastage = ৫%</p>
                        <p>• ১০০০ ইউনিট প্রোডাকশনে লাগবে:</p>
                        <p className="ml-4">০.৫ × ১০০০ × (১ + ৫/১০০)</p>
                        <p className="ml-4">= ০.৫ × ১০০০ × ১.০৫</p>
                        <p className="ml-4 font-medium">= ৫২৫ gram</p>
                      </div>
                      
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg">
                        <p className="text-yellow-600">⚠️ গুরুত্বপূর্ণ:</p>
                        <p>• Wastage বেশি হলে Manufacturing Cost বাড়বে</p>
                        <p>• সাধারণত herbs-এ ৩-৫% এবং packaging-এ ১-২% Wastage হয়</p>
                        <p>• সঠিক Wastage দিলে স্টক হিসাব নির্ভুল হবে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bom-version">
                  <AccordionTrigger className="text-sm font-medium">
                    📝 BOM Version ব্যবস্থাপনা
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>প্রতিটি প্রোডাক্টের একটি Active BOM থাকে। রেসিপি পরিবর্তন করতে:</p>
                      
                      <p><strong>নতুন ভার্সন তৈরি:</strong></p>
                      <p>• BOM তালিকায় Copy (📋) আইকনে ক্লিক করুন</p>
                      <p>• নতুন ভার্সন তৈরি হবে এবং পুরনো ভার্সন Inactive হবে</p>
                      <p>• নতুন ভার্সনে প্রয়োজনীয় পরিবর্তন করুন</p>
                      
                      <div className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                        <p className="text-blue-600">💡 মনে রাখবেন:</p>
                        <p>• শুধুমাত্র Active BOM দিয়ে নতুন Production হয়</p>
                        <p>• পুরনো BOM দিয়ে যে Production হয়েছে তার হিসাব ঠিক থাকবে</p>
                        <p>• ভার্সন হিস্টোরি সংরক্ষিত থাকে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cost-calc">
                  <AccordionTrigger className="text-sm font-medium">
                    💰 Manufacturing Cost হিসাব
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>BOM-এ Estimated Manufacturing Cost স্বয়ংক্রিয়ভাবে হিসাব হয়:</p>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">ফর্মুলা:</p>
                        <p>প্রতিটি কাঁচামালের জন্য:</p>
                        <p className="ml-4">Cost = Qty/Unit × (1 + Wastage%) × Cost per Unit</p>
                        <p className="mt-2">মোট Cost = সব কাঁচামালের Cost যোগ</p>
                      </div>
                      
                      <div className="p-3 bg-green-500/10 rounded-lg mt-2">
                        <p className="font-medium">উদাহরণ:</p>
                        <p>Ascorbic Acid: ০.৫g × ১.০৫ × ৳২/g = ৳১.০৫</p>
                        <p>Capsule Shell: ১ pc × ১.০২ × ৳০.৫/pc = ৳০.৫১</p>
                        <p>Strip Foil: ০.১ × ১.০১ × ৳০.৩ = ৳০.০৩</p>
                        <p className="font-medium mt-2">মোট = ৳১.৫৯/ইউনিট</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>
          </TabsContent>

          {/* Production Tab */}
          <TabsContent value="production" className="mt-6">
            <ModuleCard
              icon={<Factory className="h-5 w-5 text-primary" />}
              title="প্রোডাকশন ব্যবস্থাপনা"
              description="উৎপাদন ব্যাচ তৈরি, কাঁচামাল ব্যবহার এবং স্টক আপডেট"
            >
              <ManualSection title="📌 প্রোডাকশন কি?" type="info">
                {`Production হলো কাঁচামাল থেকে Finished Product তৈরির প্রক্রিয়া।

• প্রতিটি Production-এর একটি ইউনিক Batch Number থাকে (যেমন: BATCH-2025-001)
• এই Batch Number দিয়ে পরে সম্পূর্ণ ট্রেসেবিলিটি সম্ভব
• কোন কাঁচামাল ব্যবহার হয়েছে, কতটুকু উৎপাদন হয়েছে সব ট্র্যাক হয়
• Expiry Date ট্র্যাকিং এবং FIFO নিশ্চিত হয়`}
              </ManualSection>

              <ManualSection title="🔄 Production Status Flow" type="success">
                {`Production Batch-এর ৪টি Status:

📋 Planned (পরিকল্পিত):
   → Batch তৈরি হয়েছে, কাজ শুরু হয়নি
   → কাঁচামাল এখনো Deduct হয়নি
   → Cancel বা Start করা যাবে

🏃 In Progress (চলমান):
   → কাজ শুরু হয়েছে
   → কাঁচামাল স্টক থেকে Deduct হয়ে গেছে
   → এখন শুধু Complete করা যাবে

✅ Completed (সম্পন্ন):
   → কাজ শেষ
   → Finished Goods Stock-এ যোগ হয়েছে
   → আর পরিবর্তন করা যাবে না

❌ Cancelled (বাতিল):
   → বাতিল হয়েছে (শুধু Planned থেকে)
   → কোন স্টক পরিবর্তন হয়নি`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="create-batch">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ Production Batch কিভাবে তৈরি করবেন?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "New Batch" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> প্রোডাক্ট সিলেক্ট করুন (সার্চ করতে পারবেন)</p>
                      <p className="ml-4 text-yellow-600">⚠️ প্রোডাক্টের Active BOM থাকতে হবে!</p>
                      
                      <p><strong>ধাপ ৩:</strong> প্যাকেজিং কনফিগ সিলেক্ট করুন</p>
                      <p className="ml-4">(Default কনফিগ অটো-সিলেক্ট হবে)</p>
                      
                      <p><strong>ধাপ ৪:</strong> পরিমাণ দিন এবং ইউনিট টাইপ সিলেক্ট করুন:</p>
                      <ul className="ml-4 list-disc list-inside">
                        <li>ইউনিট (Units) - সরাসরি ট্যাবলেট/ক্যাপসুল সংখ্যা</li>
                        <li>স্ট্রিপ/বোতল (Primary) - প্রাইমারি প্যাক সংখ্যা</li>
                        <li>বক্স (Secondary) - বক্স সংখ্যা</li>
                        <li>কার্টন (Tertiary) - কার্টন সংখ্যা</li>
                      </ul>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">উদাহরণ:</p>
                        <p>৫ কার্টন সিলেক্ট করলে সিস্টেম দেখাবে:</p>
                        <p>৫ কার্টন → ৬০ বক্স → ৬০০ স্ট্রিপ → <strong>৬,০০০ ইউনিট</strong></p>
                      </div>
                      
                      <p><strong>ধাপ ৫:</strong> Manufacturing Date দিন</p>
                      <p><strong>ধাপ ৬:</strong> Expiry Date দিন</p>
                      <p><strong>ধাপ ৭:</strong> Material Requirements চেক করুন</p>
                      <p className="ml-4 text-red-600">❌ কাঁচামাল পর্যাপ্ত না থাকলে লাল দেখাবে</p>
                      <p className="ml-4 text-green-600">✅ পর্যাপ্ত থাকলে সবুজ টিক দেখাবে</p>
                      
                      <p><strong>ধাপ ৮:</strong> "Create Batch" বাটনে ক্লিক করুন</p>
                      
                      <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                        <p className="text-red-600">❌ Batch তৈরি হবে না যদি:</p>
                        <p>• কোন কাঁচামালের স্টক পর্যাপ্ত না থাকে</p>
                        <p>• প্রোডাক্টের Active BOM না থাকে</p>
                        <p>• প্যাকেজিং কনফিগ না থাকে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="start-production">
                  <AccordionTrigger className="text-sm font-medium">
                    ▶️ Production শুরু করা (Start)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>"Start" বাটনে ক্লিক করলে যা হয়:</p>
                      
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <p className="font-medium text-blue-600">অটোমেটিক প্রভাব:</p>
                        <p>✅ Status: Planned → In Progress</p>
                        <p>✅ BOM অনুযায়ী কাঁচামাল স্টক থেকে Deduct হয়</p>
                        <p>✅ প্রতিটি কাঁচামালের Stock Ledger-এ "Production Out" এন্ট্রি হয়</p>
                        <p>✅ FIFO অনুযায়ী পুরনো Batch থেকে কাঁচামাল নেওয়া হয়</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-500/10 rounded-lg mt-2">
                        <p className="text-yellow-600">⚠️ গুরুত্বপূর্ণ সতর্কতা:</p>
                        <p>• একবার শুরু করলে কাঁচামাল ফেরত আসবে না!</p>
                        <p>• Cancel করা যাবে না (শুধু Complete করতে হবে)</p>
                        <p>• নিশ্চিত হয়ে Start করুন</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="complete-production">
                  <AccordionTrigger className="text-sm font-medium">
                    ✅ Production সম্পন্ন করা (Complete)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>"Complete" বাটনে ক্লিক করলে:</p>
                      
                      <p><strong>ধাপ ১:</strong> উৎপাদিত পরিমাণ জিজ্ঞেস করবে</p>
                      <p className="ml-4">• Planned পরিমাণ Default দেখাবে</p>
                      <p className="ml-4">• Wastage হলে কম দিতে পারেন</p>
                      <p className="ml-4">• Planned-এর বেশি দেওয়া যাবে না</p>
                      
                      <p><strong>ধাপ ২:</strong> "Complete" বাটনে ক্লিক করুন</p>
                      
                      <div className="p-3 bg-green-500/10 rounded-lg mt-2">
                        <p className="font-medium text-green-600">অটোমেটিক প্রভাব:</p>
                        <p>✅ Status: In Progress → Completed</p>
                        <p>✅ Finished Goods Stock বাড়বে</p>
                        <p>✅ Stock Ledger-এ "Production In" এন্ট্রি হবে</p>
                        <p>✅ এই Batch এখন বিক্রয়যোগ্য</p>
                      </div>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">উদাহরণ:</p>
                        <p>Planned: ৬,০০০ ইউনিট</p>
                        <p>Produced: ৫,৯৫০ ইউনিট (৫০ ইউনিট Wastage)</p>
                        <p>→ Stock-এ ৫,৯৫০ ইউনিট যোগ হবে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="material-requirements">
                  <AccordionTrigger className="text-sm font-medium">
                    📊 Material Requirements চেক করা
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>Batch তৈরির সময় Material Requirements টেবিল দেখাবে:</p>
                      
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="font-medium">৪টি ট্যাব:</p>
                        <p>🔵 <strong>API:</strong> সক্রিয় উপাদান (Units অনুযায়ী)</p>
                        <p>🟢 <strong>Primary:</strong> প্রাইমারি প্যাকেজিং (Strips অনুযায়ী)</p>
                        <p>🟠 <strong>Secondary:</strong> সেকেন্ডারি প্যাকেজিং (Boxes অনুযায়ী)</p>
                        <p>🟣 <strong>Tertiary:</strong> টারশিয়ারি প্যাকেজিং (Cartons অনুযায়ী)</p>
                      </div>
                      
                      <p className="mt-2">প্রতিটি কাঁচামালের জন্য দেখাবে:</p>
                      <ul className="list-disc list-inside">
                        <li>প্রয়োজন (Required)</li>
                        <li>আছে (Available)</li>
                        <li>খরচ (Cost)</li>
                        <li>স্ট্যাটাস (✅ বা ❌)</li>
                      </ul>
                      
                      <div className="p-3 bg-red-500/10 rounded-lg mt-2">
                        <p className="text-red-600">❌ স্টক কম থাকলে:</p>
                        <p>• "Add" বাটন দেখাবে</p>
                        <p>• ক্লিক করে সরাসরি স্টক যোগ করতে পারবেন</p>
                        <p>• স্টক যোগ হলে Batch তৈরি করা যাবে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="mt-6">
            <ModuleCard
              icon={<ShoppingCart className="h-5 w-5 text-primary" />}
              title="বিক্রয় ব্যবস্থাপনা"
              description="বিক্রয়, ইউনিট কনভার্সন, পেমেন্ট এবং ইনভয়েস"
            >
              <ManualSection title="📌 বিক্রয় মডিউল কি?" type="info">
                {`এখানে প্রোডাক্ট বিক্রয়ের Invoice তৈরি হয়।

• Customer-ভিত্তিক বা Walk-in বিক্রয়
• Batch-ভিত্তিক বিক্রয় (FIFO - আগে Expire হবে, আগে বিক্রি)
• Unit Conversion (Carton → Box → Strip → Unit)
• পেমেন্ট ট্র্যাকিং (Full/Partial/Due)
• Invoice প্রিন্ট
• লাভ-ক্ষতি স্বয়ংক্রিয় হিসাব`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="create-sale">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ বিক্রয় কিভাবে করবেন? (Step-by-Step)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "New Sale" বাটনে ক্লিক করুন</p>
                      
                      <p><strong>ধাপ ২:</strong> Invoice # (ঐচ্ছিক)</p>
                      <p className="ml-4">• খালি রাখলে অটো জেনারেট হবে: #GLL-2025-01-23-0001</p>
                      <p className="ml-4">• নিজে দিতে চাইলে লিখুন</p>
                      
                      <p><strong>ধাপ ৩:</strong> Customer সিলেক্ট করুন (ঐচ্ছিক)</p>
                      <p className="ml-4">• না দিলে "Walk-in Customer" হবে</p>
                      
                      <p><strong>ধাপ ৪:</strong> Sale Date দিন</p>
                      
                      <p><strong>ধাপ ৫:</strong> "Add Item" বাটনে ক্লিক করে প্রোডাক্ট যোগ করুন:</p>
                      
                      <div className="p-3 bg-accent rounded-lg ml-4 my-2">
                        <p className="font-medium">প্রতিটি আইটেমের জন্য:</p>
                        <p>• <strong>Product:</strong> প্রোডাক্ট সিলেক্ট করুন (শুধু In Stock দেখাবে)</p>
                        <p>• <strong>Batch:</strong> ব্যাচ সিলেক্ট করুন (FIFO অনুযায়ী সাজানো)</p>
                        <p>• <strong>Unit Type:</strong> বিক্রয়ের ইউনিট সিলেক্ট করুন</p>
                        <p className="ml-4">- Units (pcs) - সরাসরি ট্যাবলেট/ক্যাপসুল</p>
                        <p className="ml-4">- Primary (Strip/Bottle)</p>
                        <p className="ml-4">- Secondary (Box)</p>
                        <p className="ml-4">- Tertiary (Carton)</p>
                        <p>• <strong>Quantity:</strong> পরিমাণ দিন</p>
                        <p className="ml-4 text-muted-foreground">→ অটো কনভার্সন দেখাবে (= X units)</p>
                        <p>• <strong>Price:</strong> প্রতি ইউনিট মূল্য (অটো আসবে, পরিবর্তন করা যাবে)</p>
                        <p>• <strong>Discount %:</strong> এই আইটেমে ছাড়</p>
                      </div>
                      
                      <p><strong>ধাপ ৬:</strong> Total Discount ও Tax দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৭:</strong> Notes দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৮:</strong> "Create Invoice" বাটনে ক্লিক করুন</p>
                      
                      <div className="mt-3 p-3 bg-green-500/10 rounded-lg">
                        <p className="text-green-600">✅ Invoice তৈরি হলে:</p>
                        <p>• Stock স্বয়ংক্রিয়ভাবে কমবে</p>
                        <p>• Stock Ledger-এ "Sale" এন্ট্রি হবে</p>
                        <p>• Payment Status: Unpaid (🔴)</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="unit-conversion">
                  <AccordionTrigger className="text-sm font-medium">
                    🔄 Unit Conversion কিভাবে কাজ করে?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>বিক্রয়ের সময় যেকোনো ইউনিটে পরিমাণ দিতে পারেন:</p>
                      
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="font-medium">উদাহরণ - Vitamin C 500mg:</p>
                        <p>Packaging Config: ১০ units/strip, ১০ strips/box, ১২ boxes/carton</p>
                        
                        <p className="mt-2 font-medium">বিক্রয় করতে চান: ২ কার্টন</p>
                        <p>Unit Type: Tertiary (Carton) সিলেক্ট করুন</p>
                        <p>Quantity: ২</p>
                        
                        <p className="mt-2 text-primary font-medium">সিস্টেম অটো ক্যালকুলেট করবে:</p>
                        <p>২ কার্টন = ২ × ১২ × ১০ × ১০ = <strong>২,৪০০ units</strong></p>
                        
                        <p className="mt-2">স্টক থেকে ২,৪০০ units Deduct হবে</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-500/10 rounded-lg mt-2">
                        <p className="text-yellow-600">⚠️ গুরুত্বপূর্ণ:</p>
                        <p>• Price সবসময় প্রতি Unit হিসাবে</p>
                        <p>• Line Total = Units × Price × (1 - Discount%)</p>
                        <p>• স্টক চেক ও Deduct সবসময় Units-এ হয়</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payment">
                  <AccordionTrigger className="text-sm font-medium">
                    💰 পেমেন্ট ব্যবস্থাপনা
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>Invoice Details-এ গিয়ে পেমেন্ট ম্যানেজ করুন:</p>
                      
                      <p><strong>পেমেন্ট যোগ করা:</strong></p>
                      <p>ধাপ ১: "Add Payment" বাটনে ক্লিক করুন</p>
                      <p>ধাপ ২: Amount দিন</p>
                      <p>ধাপ ৩: Payment Method সিলেক্ট করুন (Cash/Bank/bKash/Nagad/Check)</p>
                      <p>ধাপ ৪: Payment Date দিন</p>
                      <p>ধাপ ৫: Reference Note দিন (ঐচ্ছিক)</p>
                      <p>ধাপ ৬: "Add Payment" বাটনে ক্লিক করুন</p>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">Payment Status:</p>
                        <p>🔴 <strong>Unpaid:</strong> কোন পেমেন্ট নেই</p>
                        <p>🟡 <strong>Partial:</strong> আংশিক পেমেন্ট হয়েছে</p>
                        <p>🟢 <strong>Paid:</strong> সম্পূর্ণ পেমেন্ট হয়েছে</p>
                      </div>
                      
                      <div className="p-3 bg-blue-500/10 rounded-lg mt-2">
                        <p className="text-blue-600">💡 স্বয়ংক্রিয় আপডেট:</p>
                        <p>• প্রতিটি পেমেন্ট যোগে Status অটো আপডেট হয়</p>
                        <p>• Customer Outstanding Balance অটো আপডেট হয়</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="stock-rules">
                  <AccordionTrigger className="text-sm font-medium">
                    ⚠️ বিক্রয়ের বিধিনিষেধ
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-red-500/10 rounded-lg">
                        <p className="font-medium text-red-600">❌ বিক্রয় করা যাবে না যখন:</p>
                        <p>• প্রোডাক্টের স্টক শূন্য</p>
                        <p>• বিক্রয় পরিমাণ Available Stock-এর বেশি</p>
                        <p>• সিলেক্ট করা Batch-এ পর্যাপ্ত স্টক নেই</p>
                      </div>
                      
                      <div className="p-3 bg-green-500/10 rounded-lg mt-2">
                        <p className="font-medium text-green-600">✅ FIFO নিশ্চিত করতে:</p>
                        <p>• Batch সিলেক্ট করলে FIFO অনুসরণ হয়</p>
                        <p>• আগে Expire হবে এমন Batch আগে দেখাবে</p>
                        <p>• সবসময় Batch সিলেক্ট করুন</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="profit-calc">
                  <AccordionTrigger className="text-sm font-medium">
                    📊 লাভ-ক্ষতি হিসাব
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>বিক্রয়ে লাভ স্বয়ংক্রিয়ভাবে হিসাব হয়:</p>
                      
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="font-medium">ফর্মুলা:</p>
                        <p>Gross Profit = বিক্রয় মূল্য - পণ্য খরচ (COGS)</p>
                        <p>COGS = Quantity × Cost Price</p>
                        
                        <p className="mt-2 font-medium">উদাহরণ:</p>
                        <p>১০০ ইউনিট বিক্রয় @ ৳১০/ইউনিট = ৳১,০০০</p>
                        <p>Cost Price = ৳৬/ইউনিট → COGS = ৳৬০০</p>
                        <p className="font-medium">Gross Profit = ৳১,০০০ - ৳৬০০ = ৳৪০০</p>
                      </div>
                      
                      <div className="p-3 bg-green-500/10 rounded-lg mt-2">
                        <p className="text-green-600">📊 Dashboard-এ দেখুন:</p>
                        <p>• আজকের নেট লাভ</p>
                        <p>• এই মাসের নেট লাভ</p>
                        <p>• দৈনিক/মাসিক ট্রেন্ড চার্ট</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>
          </TabsContent>

          {/* Returns & Damage Tab */}
          <TabsContent value="returns" className="mt-6">
            <ModuleCard
              icon={<RotateCcw className="h-5 w-5 text-primary" />}
              title="বিক্রয় ফেরত (Sales Returns)"
              description="বিক্রি করা পণ্য ফেরত প্রসেসিং"
            >
              <ManualSection title="📌 বিক্রয় ফেরত কি?" type="info">
                {`বিক্রি করা পণ্য ফেরত আসলে এখানে প্রসেস হয়।

ফেরতের কারণ হতে পারে:
• Customer Return (গ্রাহক ফেরত দিয়েছে)
• Quality Issue (মান সমস্যা)
• Damaged in Transit (পরিবহনে ক্ষতি)
• Wrong Product (ভুল পণ্য)
• Expired Product (মেয়াদ উত্তীর্ণ)`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="process-return">
                  <AccordionTrigger className="text-sm font-medium">
                    🔄 ফেরত কিভাবে প্রসেস করবেন?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> Sales পেজে যান</p>
                      <p><strong>ধাপ ২:</strong> যে Invoice-এ ফেরত করতে চান সেটি ক্লিক করুন</p>
                      <p><strong>ধাপ ৩:</strong> "Process Return" (↩️) বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ৪:</strong> যে Item ফেরত আসছে সেটি সিলেক্ট করুন</p>
                      <p><strong>ধাপ ৫:</strong> Return Quantity দিন (মূল বিক্রয়ের চেয়ে বেশি যাবে না)</p>
                      <p><strong>ধাপ ৬:</strong> Reason সিলেক্ট করুন</p>
                      <p><strong>ধাপ ৭:</strong> "Restore to Stock" চেক করুন যদি পণ্য বিক্রয়যোগ্য থাকে</p>
                      <p><strong>ধাপ ৮:</strong> Notes দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৯:</strong> Submit করুন</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="return-options">
                  <AccordionTrigger className="text-sm font-medium">
                    📦 ফেরত পণ্যের ভবিষ্যত (২টি অপশন)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <p className="font-medium text-green-600">✅ Restore to Stock (পণ্য ভালো থাকলে):</p>
                        <p>• সরাসরি Sellable Stock-এ ফেরত যাবে</p>
                        <p>• Stock Ledger-এ "Sale Return" এন্ট্রি হবে</p>
                        <p>• পণ্য আবার বিক্রয়যোগ্য হবে</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-500/10 rounded-lg">
                        <p className="font-medium text-yellow-600">⚠️ Damaged (Restore না করলে):</p>
                        <p>• Damaged Goods-এ চলে যাবে</p>
                        <p>• Sellable Stock-এ যাবে না</p>
                        <p>• পরে Restore বা Destroy করা যাবে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>

            <ModuleCard
              icon={<AlertTriangle className="h-5 w-5 text-primary" />}
              title="ক্ষতিগ্রস্ত পণ্য (Damaged Goods)"
              description="নষ্ট, ক্ষতিগ্রস্ত এবং মেয়াদোত্তীর্ণ পণ্য ব্যবস্থাপনা"
            >
              <ManualSection title="📌 Damaged Goods কি?" type="info">
                {`Damaged Goods হলো সেই পণ্য যা বিক্রয়যোগ্য নয়:

• Handling-এ ক্ষতি (Handling Damage)
• মেয়াদোত্তীর্ণ (Expired)
• মান সমস্যা (Quality Reject)
• উৎপাদনে নষ্ট (Manufacturing Wastage)
• Customer Return (ক্ষতিগ্রস্ত)
• পরিবহনে ক্ষতি (Transit Damage)`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="record-damage">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ Damage কিভাবে রেকর্ড করবেন?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "Record Damage" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> Product সিলেক্ট করুন (শুধু Stock আছে এমন দেখাবে)</p>
                      <p><strong>ধাপ ৩:</strong> Batch সিলেক্ট করুন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৪:</strong> Quantity দিন (Current Stock-এর বেশি যাবে না)</p>
                      <p><strong>ধাপ ৫:</strong> Damage Type সিলেক্ট করুন</p>
                      <p><strong>ধাপ ৬:</strong> Notes দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৭:</strong> Submit করুন</p>
                      
                      <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                        <p className="text-red-600 font-medium">❌ অটোমেটিক প্রভাব:</p>
                        <p>• Stock থেকে পরিমাণ Deduct হবে</p>
                        <p>• Stock Ledger-এ "Damage Out" এন্ট্রি হবে</p>
                        <p>• Pending Damaged Goods-এ যোগ হবে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pending-actions">
                  <AccordionTrigger className="text-sm font-medium">
                    🔄 Pending Items নিয়ে কি করবেন?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <p>Pending আইটেমের ২টি অপশন:</p>
                      
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <p className="font-medium text-green-600">✅ Restore (পণ্য ঠিক হলে):</p>
                        <p>• Sellable Stock-এ ফেরত যাবে</p>
                        <p>• Stock Ledger-এ "Adjustment In" হবে</p>
                        <p>• Status: Restored হবে</p>
                        <p className="mt-2">ব্যবহার: পণ্য মেরামত করা হয়েছে, ভুলে রেকর্ড হয়েছিল</p>
                      </div>
                      
                      <div className="p-3 bg-red-500/10 rounded-lg">
                        <p className="font-medium text-red-600">🗑️ Destroy (পণ্য পুরোপুরি নষ্ট):</p>
                        <p>• স্থায়ীভাবে লস হিসাবে রেকর্ড হবে</p>
                        <p>• স্টক আর বাড়বে না</p>
                        <p>• Status: Destroyed হবে</p>
                        <p>• Financial Loss Report-এ দেখাবে</p>
                        <p className="mt-2">ব্যবহার: সত্যিই নষ্ট, মেয়াদ উত্তীর্ণ</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="damage-financial">
                  <AccordionTrigger className="text-sm font-medium">
                    💰 Damage-এর আর্থিক প্রভাব
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>Damage/Loss স্বয়ংক্রিয়ভাবে হিসাব হয়:</p>
                      
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="font-medium">ক্যালকুলেশন:</p>
                        <p>Loss Value = Quantity × Cost Price</p>
                        
                        <p className="mt-2 font-medium">উদাহরণ:</p>
                        <p>৫০ ইউনিট নষ্ট @ ৳৬/ইউনিট Cost</p>
                        <p>Loss = ৫০ × ৳৬ = <span className="text-red-600 font-medium">৳৩০০ Loss</span></p>
                      </div>
                      
                      <div className="p-3 bg-blue-500/10 rounded-lg mt-2">
                        <p className="text-blue-600">📊 Dashboard Cards দেখুন:</p>
                        <p>• Today's Loss: আজকের ক্ষতি</p>
                        <p>• Monthly Loss: এই মাসের মোট ক্ষতি</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="mt-6">
            <ModuleCard
              icon={<Wallet className="h-5 w-5 text-primary" />}
              title="খরচ ব্যবস্থাপনা (Expenses)"
              description="ব্যবসায়িক খরচ রেকর্ড এবং লাভ-ক্ষতিতে এর প্রভাব"
            >
              <ManualSection title="📌 খরচ মডিউল কি?" type="info">
                {`এখানে ব্যবসার সকল খরচ রেকর্ড করা হয়:

• বেতন (Salaries)
• ভাড়া (Rent)
• বিদ্যুৎ/গ্যাস (Utilities)
• পরিবহন (Transportation)
• রক্ষণাবেক্ষণ (Maintenance)
• মার্কেটিং (Marketing)
• অফিস সাপ্লাই (Office Supplies)
• অন্যান্য খরচ

💡 খরচ সরাসরি Net Profit কমায়`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-expense">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ খরচ কিভাবে যোগ করবেন?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "Add Expense" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> Category সিলেক্ট করুন</p>
                      <p><strong>ধাপ ৩:</strong> Amount দিন</p>
                      <p><strong>ধাপ ৪:</strong> Expense Date দিন</p>
                      <p><strong>ধাপ ৫:</strong> Payment Method সিলেক্ট করুন (Cash/Bank)</p>
                      <p><strong>ধাপ ৬:</strong> Bank Payment হলে Bank Account সিলেক্ট করুন</p>
                      <p><strong>ধাপ ৭:</strong> Description দিন</p>
                      <p><strong>ধাপ ৮:</strong> Reference Number দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৯:</strong> Submit করুন</p>
                      
                      <div className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                        <p className="text-blue-600">💡 Bank Payment হলে:</p>
                        <p>• Bank Account-এর Balance স্বয়ংক্রিয়ভাবে কমবে</p>
                        <p>• Bank Transactions-এ "Withdrawal" এন্ট্রি হবে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="expense-profit">
                  <AccordionTrigger className="text-sm font-medium">
                    💰 লাভ-ক্ষতিতে প্রভাব
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="font-medium">Net Profit ফর্মুলা:</p>
                        <p>বিক্রয় (Sales Revenue)</p>
                        <p>➖ পণ্য খরচ (COGS - Cost of Goods Sold)</p>
                        <p>= Gross Profit</p>
                        <p>➖ খরচ (Expenses)</p>
                        <p>➖ ক্ষতি (Damage Loss)</p>
                        <p className="font-medium mt-2">= Net Profit</p>
                      </div>
                      
                      <div className="p-3 bg-green-500/10 rounded-lg mt-2">
                        <p className="font-medium">উদাহরণ:</p>
                        <p>আজকের বিক্রয়: ৳৫০,০০০</p>
                        <p>COGS: ৳৩০,০০০</p>
                        <p>= Gross Profit: ৳২০,০০০</p>
                        <p>আজকের খরচ: ৳৫,০০০</p>
                        <p>Damage Loss: ৳১,০০০</p>
                        <p className="font-medium text-green-600">= Net Profit: ৳১৪,০০০</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>

            <ModuleCard
              icon={<Building2 className="h-5 w-5 text-primary" />}
              title="ব্যাংক একাউন্ট"
              description="ব্যাংক একাউন্ট এবং লেনদেন ব্যবস্থাপনা"
            >
              <ManualSection title="📌 ব্যাংক একাউন্ট মডিউল কি?" type="info">
                {`একাধিক ব্যাংক একাউন্ট ট্র্যাকিং:

• Deposit/Withdrawal রেকর্ড
• Balance ট্র্যাকিং
• Transaction History
• Expense Payment Integration`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-account">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ একাউন্ট কিভাবে যোগ করবেন?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "Add Account" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> Account Name দিন (যেমন: Islami Bank Main)</p>
                      <p><strong>ধাপ ৩:</strong> Bank Name দিন</p>
                      <p><strong>ধাপ ৪:</strong> Account Number দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৫:</strong> Branch দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৬:</strong> Opening Balance দিন</p>
                      <p><strong>ধাপ ৭:</strong> Submit করুন</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="transactions">
                  <AccordionTrigger className="text-sm font-medium">
                    💵 Deposit/Withdrawal করা
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>একাউন্টে ক্লিক করে Transaction করুন:</p>
                      
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <p className="font-medium text-green-600">➕ Deposit (জমা):</p>
                        <p>• Amount দিন</p>
                        <p>• Description দিন</p>
                        <p>• Balance বাড়বে</p>
                      </div>
                      
                      <div className="p-3 bg-red-500/10 rounded-lg mt-2">
                        <p className="font-medium text-red-600">➖ Withdrawal (উত্তোলন):</p>
                        <p>• Amount দিন</p>
                        <p>• Description দিন</p>
                        <p>• Balance কমবে</p>
                      </div>
                      
                      <div className="p-3 bg-blue-500/10 rounded-lg mt-2">
                        <p className="text-blue-600">💡 স্বয়ংক্রিয় লেনদেন:</p>
                        <p>• Expense (Bank Payment) → Withdrawal হয়</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>

            <ModuleCard
              icon={<Users className="h-5 w-5 text-primary" />}
              title="কাস্টমার ও সাপ্লায়ার"
              description="পার্টি ম্যানেজমেন্ট এবং বাকি ট্র্যাকিং"
            >
              <ManualSection title="📌 পার্টি ম্যানেজমেন্ট" type="info">
                {`দুই ধরনের পার্টি:

👥 কাস্টমার (Customers):
• পণ্য ক্রেতা
• বিক্রয় Invoice-এ সংযুক্ত
• বাকি (Receivable) ট্র্যাকিং

🚚 সাপ্লায়ার (Sellers):
• কাঁচামাল সরবরাহকারী
• Purchase Order-এ সংযুক্ত
• পাওনা (Payable) ট্র্যাকিং`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-customer">
                  <AccordionTrigger className="text-sm font-medium">
                    ➕ কাস্টমার/সাপ্লায়ার যোগ করা
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>ধাপ ১:</strong> "Add Customer" বা "Add Seller" বাটনে ক্লিক করুন</p>
                      <p><strong>ধাপ ২:</strong> Name দিন (আবশ্যক)</p>
                      <p><strong>ধাপ ৩:</strong> Phone দিন</p>
                      <p><strong>ধাপ ৪:</strong> Email দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৫:</strong> Address, City, State দিন</p>
                      <p><strong>ধাপ ৬:</strong> GST Number দিন (ঐচ্ছিক)</p>
                      <p><strong>ধাপ ৭:</strong> Submit করুন</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="outstanding">
                  <AccordionTrigger className="text-sm font-medium">
                    💰 Outstanding Balance কিভাবে কাজ করে?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="font-medium">কাস্টমার Outstanding (বাকি):</p>
                        <p>= মোট বিক্রয় - মোট পেমেন্ট</p>
                        
                        <p className="mt-2">বাকি বাড়ে:</p>
                        <p>✅ নতুন বিক্রয় হলে (Unpaid/Partial)</p>
                        
                        <p className="mt-2">বাকি কমে:</p>
                        <p>✅ পেমেন্ট রিসিভ করলে</p>
                        <p>✅ Sales Return হলে</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <ModuleCard
              icon={<BarChart3 className="h-5 w-5 text-primary" />}
              title="রিপোর্ট ও বিশ্লেষণ"
              description="সকল ব্যবসায়িক রিপোর্ট এবং ড্যাশবোর্ড"
            >
              <ManualSection title="📌 রিপোর্ট মডিউল কি?" type="info">
                {`সমস্ত ব্যবসায়িক রিপোর্ট এখানে পাবেন:

• বিক্রয় রিপোর্ট (Sales Reports)
• ইনভেন্টরি রিপোর্ট (Stock Summary)
• আর্থিক রিপোর্ট (Profit & Loss)
• পার্টি রিপোর্ট (Customer/Seller Statements)
• খরচ রিপোর্ট (Expense Reports)
• ক্ষতি রিপোর্ট (Damage/Loss Reports)

💡 সব রিপোর্ট PDF Export করা যায়`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="sales-reports">
                  <AccordionTrigger className="text-sm font-medium">
                    📈 বিক্রয় রিপোর্ট
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Daily Sales:</strong> দৈনিক বিক্রয় সারাংশ</p>
                      <p><strong>Product-wise:</strong> প্রোডাক্ট অনুযায়ী বিক্রয়</p>
                      <p><strong>Customer-wise:</strong> কাস্টমার অনুযায়ী বিক্রয়</p>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">ফিল্টার অপশন:</p>
                        <p>• Date Range (Start Date - End Date)</p>
                        <p>• Customer সিলেক্ট</p>
                        <p>• Product সিলেক্ট</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="financial-reports">
                  <AccordionTrigger className="text-sm font-medium">
                    💰 আর্থিক রিপোর্ট (Profit & Loss)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="font-medium">Profit & Loss Statement:</p>
                        
                        <p className="mt-2 font-medium text-green-600">আয় (Revenue):</p>
                        <p>+ Sales Revenue</p>
                        
                        <p className="mt-2 font-medium text-red-600">ব্যয় (Expenses):</p>
                        <p>- Cost of Goods Sold (COGS)</p>
                        <p>- Operating Expenses</p>
                        <p>- Damage/Loss</p>
                        
                        <p className="mt-2 font-medium">= Net Profit/Loss</p>
                      </div>
                      
                      <div className="p-3 bg-blue-500/10 rounded-lg mt-2">
                        <p className="text-blue-600">💡 Period সিলেক্ট করুন:</p>
                        <p>• আজ (Today)</p>
                        <p>• এই সপ্তাহ (This Week)</p>
                        <p>• এই মাস (This Month)</p>
                        <p>• Custom Date Range</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="inventory-reports">
                  <AccordionTrigger className="text-sm font-medium">
                    📦 ইনভেন্টরি রিপোর্ট
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Stock Summary:</strong> সব আইটেমের বর্তমান স্টক</p>
                      <p><strong>Low Stock:</strong> কম স্টক আছে এমন আইটেম</p>
                      <p><strong>Stock Valuation:</strong> স্টকের মোট মূল্য</p>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">Stock Valuation ফর্মুলা:</p>
                        <p>Raw Materials: Quantity × Cost per Unit</p>
                        <p>Finished Goods: Quantity × Cost Price</p>
                        <p className="font-medium mt-2">Total = All Items Sum</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="party-reports">
                  <AccordionTrigger className="text-sm font-medium">
                    👥 পার্টি রিপোর্ট
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Customer Statement:</strong> কাস্টমারের সম্পূর্ণ লেনদেন ইতিহাস</p>
                      <p><strong>Seller Statement:</strong> সাপ্লায়ারের লেনদেন ইতিহাস</p>
                      <p><strong>Outstanding Report:</strong> বাকি আছে এমন সব পার্টি</p>
                      
                      <div className="p-3 bg-accent rounded-lg mt-2">
                        <p className="font-medium">Statement দেখায়:</p>
                        <p>• Opening Balance</p>
                        <p>• প্রতিটি Invoice/Payment</p>
                        <p>• Running Balance</p>
                        <p>• Closing Balance</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>

            <ModuleCard
              icon={<Clock className="h-5 w-5 text-primary" />}
              title="মেয়াদ সতর্কতা (Expiry Alerts)"
              description="মেয়াদোত্তীর্ণ হতে যাওয়া পণ্যের সতর্কতা"
            >
              <ManualSection title="📌 Expiry Alerts কি?" type="warning">
                {`মেয়াদোত্তীর্ণ হতে যাওয়া Production Batch-এর তালিকা:

🔴 Expired: মেয়াদ শেষ হয়ে গেছে
🟠 Critical: ৩০ দিনের মধ্যে মেয়াদ শেষ
🟡 Warning: ৬০ দিনের মধ্যে মেয়াদ শেষ
🟢 Info: ৯০ দিনের মধ্যে মেয়াদ শেষ

💡 FIFO অনুসরণ করলে Expiry-এর আগেই বিক্রি হয়ে যাবে`}
              </ManualSection>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="expiry-action">
                  <AccordionTrigger className="text-sm font-medium">
                    🔄 কি করবেন Expiry Alert দেখলে?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-yellow-500/10 rounded-lg">
                        <p className="font-medium text-yellow-600">🟠 Critical/Warning:</p>
                        <p>• দ্রুত বিক্রয়ের ব্যবস্থা করুন</p>
                        <p>• ডিসকাউন্ট দিয়ে বিক্রি করতে পারেন</p>
                        <p>• FIFO অনুসরণ করুন</p>
                      </div>
                      
                      <div className="p-3 bg-red-500/10 rounded-lg mt-2">
                        <p className="font-medium text-red-600">🔴 Expired:</p>
                        <p>• বিক্রয় করবেন না!</p>
                        <p>• Damaged Goods-এ রেকর্ড করুন</p>
                        <p>• Damage Type: Expired সিলেক্ট করুন</p>
                        <p>• Destroy করুন</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ModuleCard>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="flows" className="mt-6">
            <ModuleCard
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              title="সম্পূর্ণ কর্মপ্রবাহ (End-to-End Flows)"
              description="শূন্য থেকে শুরু করে সম্পূর্ণ প্রক্রিয়া"
            >
              <ManualSection title="🔄 Flow 1: নতুন প্রোডাক্ট তৈরি থেকে বিক্রয় পর্যন্ত" type="success">
                {`ধাপ ১: কাঁচামাল যোগ করুন (Raw Materials)
→ নাম, SKU, Category, Unit, Cost দিন
→ Opening Stock দিন

ধাপ ২: স্টক রিসিভ করুন (প্রয়োজনে)
→ Batch Number, Quantity, Expiry Date দিন

ধাপ ৩: প্রোডাক্ট তৈরি করুন (Products)
→ নাম, SKU, Category, Cost Price, Selling Price দিন

ধাপ ৪: প্যাকেজিং কনফিগ সেট করুন
→ Units per Strip, Strips per Box, Boxes per Carton দিন

ধাপ ৫: BOM তৈরি করুন
→ প্রতিটি লেয়ারে কাঁচামাল যোগ করুন
→ Qty/Unit ও Wastage দিন

ধাপ ৬: Production Batch তৈরি করুন
→ প্রোডাক্ট সিলেক্ট, পরিমাণ দিন
→ Material Requirements চেক করুন

ধাপ ৭: Production Start করুন
→ কাঁচামাল Deduct হবে

ধাপ ৮: Production Complete করুন
→ Finished Goods Stock-এ যোগ হবে

ধাপ ৯: বিক্রয় করুন (Sales)
→ প্রোডাক্ট, পরিমাণ, মূল্য দিন
→ Invoice তৈরি হবে

ধাপ ১০: পেমেন্ট রিসিভ করুন
→ Payment Status আপডেট হবে

✅ সম্পূর্ণ প্রক্রিয়া শেষ!`}
              </ManualSection>

              <ManualSection title="🔄 Flow 2: বিক্রয় ফেরত প্রক্রিয়া" type="info">
                {`ধাপ ১: Sales পেজে যান
→ যে Invoice-এ ফেরত করতে চান সেটি খুলুন

ধাপ ২: "Process Return" বাটনে ক্লিক করুন

ধাপ ৩: Return Details দিন
→ Item সিলেক্ট, Quantity, Reason দিন

ধাপ ৪: সিদ্ধান্ত নিন:
→ পণ্য ভালো? ✅ Restore to Stock
→ পণ্য নষ্ট? ❌ Damaged Goods-এ যাবে

ধাপ ৫: (Damaged হলে) Damaged Goods পেজে যান
→ Restore বা Destroy করুন`}
              </ManualSection>

              <ManualSection title="🔄 Flow 3: মেয়াদ উত্তীর্ণ পণ্য প্রক্রিয়া" type="warning">
                {`ধাপ ১: Expiry Alerts পেজে যান
→ Expired/Critical আইটেম দেখুন

ধাপ ২: (যদি বিক্রয়যোগ্য) দ্রুত বিক্রয় করুন
→ ডিসকাউন্ট দিয়ে বিক্রি করতে পারেন

ধাপ ৩: (যদি Expired) Damaged Goods-এ রেকর্ড করুন
→ Products → Damage Type: Expired

ধাপ ৪: Damaged Goods-এ যান
→ "Destroy" বাটনে ক্লিক করুন
→ কারণ লিখুন

ধাপ ৫: Loss Report দেখুন
→ Reports → Damage/Loss Reports`}
              </ManualSection>

              <ManualSection title="⚠️ সাধারণ ভুল এবং সমাধান" type="danger">
                {`❌ ভুল: BOM ছাড়া Production করতে চাওয়া
✅ সমাধান: প্রথমে BOM তৈরি করুন

❌ ভুল: স্টক নেই অথচ বিক্রয় করতে চাওয়া
✅ সমাধান: Production Complete করুন, তারপর বিক্রয় করুন

❌ ভুল: Production Start করার পর Cancel করতে চাওয়া
✅ সমাধান: Complete করুন, প্রয়োজনে কম পরিমাণ দিন

❌ ভুল: Packaging Config না দিয়ে Production করতে চাওয়া
✅ সমাধান: Products পেজ থেকে Packaging Config সেট করুন

❌ ভুল: ভুল Unit Type-এ বিক্রয় করা
✅ সমাধান: Unit Conversion চেক করুন, সঠিক ইউনিট সিলেক্ট করুন`}
              </ManualSection>
            </ModuleCard>

            <ModuleCard
              icon={<Shield className="h-5 w-5 text-primary" />}
              title="সিস্টেম নিয়ম ও সীমাবদ্ধতা"
              description="কি করা যায়, কি করা যায় না"
            >
              <ManualSection title="🔒 অপরিবর্তনীয় নিয়ম" type="danger">
                {`এই নিয়মগুলো পরিবর্তন করা যায় না:

❌ BOM ছাড়া Production তৈরি করা যায় না
❌ Packaging Config ছাড়া Production করা যায় না
❌ কাঁচামাল পর্যাপ্ত না থাকলে Production তৈরি হয় না
❌ Production Start হলে Cancel করা যায় না
❌ Stock-এর বেশি বিক্রয় করা যায় না
❌ Stock Ledger Entry মুছা যায় না
❌ Completed Production পরিবর্তন করা যায় না
❌ Destroyed Damaged Goods পুনরুদ্ধার করা যায় না`}
              </ManualSection>

              <ManualSection title="✅ করা যায় এমন কাজ" type="success">
                {`এই কাজগুলো করতে পারবেন:

✅ কাঁচামাল/প্রোডাক্ট Edit করা (নাম, দাম ইত্যাদি)
✅ কাঁচামাল/প্রোডাক্ট Soft Delete ও Restore করা
✅ নতুন BOM Version তৈরি করা
✅ Packaging Config পরিবর্তন করা (নতুন Production-এ প্রযোজ্য)
✅ Pending Damaged Goods Restore করা
✅ Payment যোগ/ডিলিট করা
✅ Bank Transaction করা
✅ Expense Edit/Delete করা
✅ Customer/Seller তথ্য আপডেট করা`}
              </ManualSection>
            </ModuleCard>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                📖 এই ম্যানুয়ালটি গাজী ল্যাবরেটরীজ লিমিটেড ERP সিস্টেমের জন্য তৈরি
              </p>
              <p className="text-xs text-muted-foreground">
                প্রশ্ন বা সমস্যা থাকলে IT বিভাগে যোগাযোগ করুন
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
