import { NavLink } from 'react-router-dom';
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
  Database
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/raw-materials', icon: Leaf, label: 'Raw Materials' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/bom', icon: ClipboardList, label: 'Bill of Materials' },
  { to: '/production', icon: Factory, label: 'Production' },
  { to: '/stock-ledger', icon: Boxes, label: 'Stock Ledger' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/sellers', icon: Building2, label: 'Sellers' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/backup', icon: Database, label: 'Backup & Restore' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Factory className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold text-foreground">ManufactureERP</span>
      </div>
      <nav className="space-y-1 p-4">
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
    </aside>
  );
}
