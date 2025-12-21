import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RawMaterialsPage from "./pages/RawMaterialsPage";
import ProductsPage from "./pages/ProductsPage";
import BOMPage from "./pages/BOMPage";
import ProductionPage from "./pages/ProductionPage";
import StockLedgerPage from "./pages/StockLedgerPage";
import CustomersPage from "./pages/CustomersPage";
import SellersPage from "./pages/SellersPage";
import ReportsPage from "./pages/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/raw-materials" element={<RawMaterialsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/bom" element={<BOMPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/stock-ledger" element={<StockLedgerPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/sellers" element={<SellersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
