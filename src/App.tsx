import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import RawMaterialsPage from "./pages/RawMaterialsPage";
import ProductsPage from "./pages/ProductsPage";
import BOMPage from "./pages/BOMPage";
import ProductionPage from "./pages/ProductionPage";
import StockLedgerPage from "./pages/StockLedgerPage";
import CustomersPage from "./pages/CustomersPage";
import SellersPage from "./pages/SellersPage";
import SalesPage from "./pages/SalesPage";
import SalesReturnsPage from "./pages/SalesReturnsPage";
import DamagedGoodsPage from "./pages/DamagedGoodsPage";
import ReportsPage from "./pages/ReportsPage";
import BackupRestorePage from "./pages/BackupRestorePage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import ExpiryAlertsPage from "./pages/ExpiryAlertsPage";
import AIHubPage from "./pages/AIHubPage";
import BankAccountsPage from "./pages/BankAccountsPage";
import ExpensesPage from "./pages/ExpensesPage";
import PriceListPage from "./pages/PriceListPage";
import NotFound from "./pages/NotFound";
import PackagingAssembliesPage from "./pages/PackagingAssembliesPage";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/raw-materials" element={<ProtectedRoute><RawMaterialsPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/bom" element={<ProtectedRoute><BOMPage /></ProtectedRoute>} />
          <Route path="/production" element={<ProtectedRoute><ProductionPage /></ProtectedRoute>} />
          <Route path="/stock-ledger" element={<ProtectedRoute><StockLedgerPage /></ProtectedRoute>} />
          <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrdersPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/sellers" element={<ProtectedRoute><SellersPage /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
          <Route path="/sales-returns" element={<ProtectedRoute><SalesReturnsPage /></ProtectedRoute>} />
          <Route path="/damaged-goods" element={<ProtectedRoute><DamagedGoodsPage /></ProtectedRoute>} />
          <Route path="/expiry-alerts" element={<ProtectedRoute><ExpiryAlertsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/bank-accounts" element={<ProtectedRoute><BankAccountsPage /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
          <Route path="/price-list" element={<ProtectedRoute><PriceListPage /></ProtectedRoute>} />
          <Route path="/backup" element={<ProtectedRoute><BackupRestorePage /></ProtectedRoute>} />
          <Route path="/ai-hub" element={<ProtectedRoute><AIHubPage /></ProtectedRoute>} />
          <Route path="/packaging-assemblies" element={<ProtectedRoute><PackagingAssembliesPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
