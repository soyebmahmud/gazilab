import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/hooks/useCustomers';
import { useSellers } from '@/hooks/useSellers';
import { usePartyStatement } from '@/hooks/useFinancialReports';
import { Users, FileText, TrendingUp } from 'lucide-react';

const formatCurrency = (value: number) => `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

export function PartyListReport() {
  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: sellers, isLoading: loadingSellers } = useSellers();
  const [search, setSearch] = useState('');

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSellers = sellers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCustomerDue = customers?.reduce((sum, c) => sum + c.outstanding_balance, 0) || 0;
  const totalSellerDue = sellers?.reduce((sum, s) => sum + s.outstanding_balance, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          সকল পার্টি / All Parties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="নাম বা ফোন দিয়ে সার্চ করুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-primary/10">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">গ্রাহকদের কাছে পাওনা</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalCustomerDue)}</p>
              <p className="text-sm text-muted-foreground">{customers?.length || 0} জন গ্রাহক</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">বিক্রেতাদের দেনা</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalSellerDue)}</p>
              <p className="text-sm text-muted-foreground">{sellers?.length || 0} জন বিক্রেতা</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">গ্রাহক</TabsTrigger>
            <TabsTrigger value="sellers">বিক্রেতা</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-4">
            {loadingCustomers ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>নাম</TableHead>
                      <TableHead>ফোন</TableHead>
                      <TableHead>ইমেইল</TableHead>
                      <TableHead>শহর</TableHead>
                      <TableHead className="text-right">বাকি</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.map((customer) => (
                      <TableRow key={customer.id} className={customer.outstanding_balance > 0 ? 'bg-yellow-500/10' : ''}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.city || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${customer.outstanding_balance > 0 ? 'text-destructive' : 'text-primary'}`}>
                          {formatCurrency(customer.outstanding_balance)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                            {customer.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredCustomers || filteredCustomers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          কোন গ্রাহক পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sellers" className="mt-4">
            {loadingSellers ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>নাম</TableHead>
                      <TableHead>ফোন</TableHead>
                      <TableHead>ইমেইল</TableHead>
                      <TableHead>শহর</TableHead>
                      <TableHead className="text-right">বাকি</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers?.map((seller) => (
                      <TableRow key={seller.id} className={seller.outstanding_balance > 0 ? 'bg-destructive/10' : ''}>
                        <TableCell className="font-medium">{seller.name}</TableCell>
                        <TableCell>{seller.phone || '-'}</TableCell>
                        <TableCell>{seller.email || '-'}</TableCell>
                        <TableCell>{seller.city || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${seller.outstanding_balance > 0 ? 'text-destructive' : 'text-primary'}`}>
                          {formatCurrency(seller.outstanding_balance)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={seller.is_active ? 'default' : 'secondary'}>
                            {seller.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredSellers || filteredSellers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          কোন বিক্রেতা পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function PartyStatementReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [partyType, setPartyType] = useState<'customer' | 'seller'>('customer');
  const [selectedParty, setSelectedParty] = useState('');
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const { data: customers } = useCustomers();
  const { data: sellers } = useSellers();
  const { data: statement, isLoading } = usePartyStatement(selectedParty, partyType, dateFrom, dateTo);

  const parties = partyType === 'customer' ? customers : sellers;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          পার্টি স্টেটমেন্ট / Party Statement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={partyType} onValueChange={(v) => { setPartyType(v as 'customer' | 'seller'); setSelectedParty(''); }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">গ্রাহক</SelectItem>
              <SelectItem value="seller">বিক্রেতা</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedParty} onValueChange={setSelectedParty}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="পার্টি নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {parties?.map((party) => (
                <SelectItem key={party.id} value={party.id}>
                  {party.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
          <span className="text-muted-foreground">থেকে</span>
          <Input 
            type="date" 
            value={dateTo} 
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : statement ? (
          <div className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h3 className="font-bold text-lg mb-4">{statement.party_name}</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">মোট {partyType === 'customer' ? 'বিক্রয়' : 'ক্রয়'}</p>
                    <p className="text-xl font-bold">{formatCurrency(statement.total_sales)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">মোট পেমেন্ট</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(statement.total_payments)}</p>
                  </div>
                  {partyType === 'customer' && (
                    <div>
                      <p className="text-sm text-muted-foreground">রিটার্ন</p>
                      <p className="text-xl font-bold text-destructive">{formatCurrency(statement.total_returns)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">বর্তমান বাকি</p>
                    <p className={`text-xl font-bold ${statement.closing_balance > 0 ? 'text-destructive' : 'text-primary'}`}>
                      {formatCurrency(statement.closing_balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            স্টেটমেন্ট দেখতে পার্টি নির্বাচন করুন
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PartyProfitReport() {
  const { data: customers, isLoading } = useCustomers();

  // For now, show customers with their outstanding balance as a simple profit indicator
  const sortedCustomers = customers?.sort((a, b) => b.outstanding_balance - a.outstanding_balance);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          পার্টি অনুযায়ী লাভ-ক্ষতি / Party-wise Profit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          এই রিপোর্টে প্রতিটি গ্রাহকের সাথে লেনদেনের সারসংক্ষেপ দেখানো হয়েছে।
        </p>

        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>গ্রাহক</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>শহর</TableHead>
                  <TableHead className="text-right">বাকি পাওনা</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCustomers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.city || '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${customer.outstanding_balance > 0 ? 'text-destructive' : 'text-primary'}`}>
                      {formatCurrency(customer.outstanding_balance)}
                    </TableCell>
                    <TableCell>
                      {customer.outstanding_balance > 10000 ? (
                        <Badge variant="destructive">উচ্চ বাকি</Badge>
                      ) : customer.outstanding_balance > 0 ? (
                        <Badge variant="secondary">বাকি আছে</Badge>
                      ) : (
                        <Badge variant="default">পরিশোধিত</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!sortedCustomers || sortedCustomers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      কোন গ্রাহক নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
