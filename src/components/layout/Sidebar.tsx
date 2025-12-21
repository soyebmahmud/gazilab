import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Factory,
  ClipboardList,
  Users,
  Building2,
  FileText,
  Leaf,
  Database,
  ShoppingCart,
  Truck,
  AlertTriangle,
  PackageX,
  RotateCcw,
  LogOut,
  Bot
} from 'lucide-react';
import gaziLogo from '@/assets/gazi-logo.svg';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/raw-materials', icon: Leaf, label: 'Raw Materials' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/bom', icon: ClipboardList, label: 'Bill of Materials' },
  { to: '/production', icon: Factory, label: 'Production' },
  { to: '/stock-ledger', icon: Boxes, label: 'Stock Ledger' },
  { to: '/purchase-orders', icon: Truck, label: 'Purchase Orders' },
  { to: '/sales', icon: ShoppingCart, label: 'Sales' },
  { to: '/sales-returns', icon: RotateCcw, label: 'Sales Returns' },
  { to: '/damaged-goods', icon: PackageX, label: 'Damaged Goods' },
  { to: '/expiry-alerts', icon: AlertTriangle, label: 'Expiry Alerts' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/sellers', icon: Building2, label: 'Sellers' },
  { to: '/ai-hub', icon: Bot, label: 'AI Hub' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/backup', icon: Database, label: 'Backup & Restore' },
];

export function Sidebar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/auth');
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card flex flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-border px-4">
        <img src={gaziLogo} alt="Gazi Laboratories Logo" className="h-12 w-12" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground leading-tight">GAZI LABORATORIES</span>
          <span className="text-xs font-semibold text-foreground leading-tight">LIMITED</span>
        </div>
      </div>
      <nav className="space-y-1 p-4 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3 space-y-2">
        {user && (
          <p className="text-xs text-muted-foreground truncate px-1">
            {user.email}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
        <p className="text-xs text-muted-foreground text-center pt-1">
          Developed by: <span className="font-medium">SOYEB MOHAMMAD ARIF</span>
        </p>
      </div>
    </aside>
  );
}
