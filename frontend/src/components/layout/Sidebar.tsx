import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  LogOut, 
  ChevronDown, 
  Activity, 
  CreditCard, 
  ShoppingBag, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  MessageSquare, 
  Boxes, 
  Truck, 
  Clock, 
  Receipt, 
  Building2, 
  Hash,
  ShieldCheck,
  Database
} from 'lucide-react';

export type SidebarNavItem = {
  id: string;
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  heading?: string;
  items: SidebarNavItem[];
};

interface SidebarProps {
  activeWorkspace: string;
  onWorkspaceSelect: (ws: string) => void;
  onOpenSearch: () => void;
}

export default function Sidebar({
  activeWorkspace,
  onWorkspaceSelect,
  onOpenSearch
}: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const role = user?.role || 'CUSTOMER';

  const getNavGroups = (): SidebarNavGroup[] => {
    switch (role) {
      case 'SALES_REP':
        return [
          {
            heading: 'Core',
            items: [
              { id: 'dashboard', title: 'Sales Dashboard', path: '/sales/dashboard', icon: LayoutDashboard },
              { id: 'quotations', title: 'Quotation Kanban', path: '/sales/quotations', icon: FolderKanban },
              { id: 'quote-builder', title: 'Create Quotation', path: '/sales/quote-builder', icon: Plus },
            ]
          },
          {
            heading: 'Pipeline & CRM',
            items: [
              { id: 'customers', title: 'Customers', path: '/sales/customers', icon: Users },
              { id: 'orders', title: 'Sales Orders', path: '/sales/orders', icon: ShoppingBag },
              { id: 'approval-status', title: 'Approval Status', path: '/sales/approval-status', icon: CheckCircle2 },
            ]
          }
        ];

      case 'SALES_MANAGER':
      case 'ADMIN':
      case 'MANAGER_ADMIN':
        return [
          {
            heading: 'Executive',
            items: [
              { id: 'dashboard', title: 'Executive Overview', path: '/management/dashboard', icon: LayoutDashboard },
              { id: 'approvals', title: 'Approvals Queue', path: '/management/approvals', icon: CheckCircle2, badge: 'Active' },
            ]
          },
          {
            heading: 'Deals & Revenue',
            items: [
              { id: 'quotations', title: 'Quotation Kanban', path: '/sales/quotations', icon: FolderKanban },
              { id: 'quote-builder', title: 'Quote Builder', path: '/sales/quote-builder', icon: Plus },
              { id: 'customers', title: 'Customer Accounts', path: '/sales/customers', icon: Users },
              { id: 'deal-health', title: 'Deal Health & Risk', path: '/management/deal-health', icon: Activity },
              { id: 'analytics', title: 'Sales Analytics', path: '/management/analytics', icon: TrendingUp },
            ]
          },
          {
            heading: 'Administration',
            items: [
              { id: 'products', title: 'Product Catalog', path: '/management/products', icon: Boxes },
              { id: 'users', title: 'User Roles & Access', path: '/management/users', icon: ShieldCheck },
              { id: 'knowledge-base', title: 'Knowledge Base', path: '/management/knowledge-base', icon: Database },
            ]
          }
        ];

      case 'OPS_FINANCE':
      case 'OPERATIONS':
      case 'FINANCE':
        return [
          {
            heading: 'Operations',
            items: [
              { id: 'dashboard', title: 'Operations Dashboard', path: '/operations/dashboard', icon: LayoutDashboard },
              { id: 'orders', title: 'Sales Orders', path: '/operations/orders', icon: ShoppingBag },
              { id: 'fulfillment', title: 'Fulfillment & Stock', path: '/operations/fulfillment', icon: Truck },
              { id: 'inventory', title: 'Inventory Levels', path: '/operations/inventory', icon: Boxes },
              { id: 'backorders', title: 'Backorders', path: '/operations/backorders', icon: Clock },
              { id: 'warehouses', title: 'Warehouses', path: '/operations/warehouses', icon: Building2 },
            ]
          },
          {
            heading: 'Billing & Subscriptions',
            items: [
              { id: 'invoices', title: 'Invoices', path: '/operations/invoices', icon: Receipt },
              { id: 'payments', title: 'Payments', path: '/operations/payments', icon: CreditCard },
              { id: 'subscriptions', title: 'Subscriptions', path: '/operations/subscriptions', icon: Activity },
            ]
          }
        ];

      case 'CUSTOMER':
      default:
        return [
          {
            heading: 'Client Portal',
            items: [
              { id: 'dashboard', title: 'Portal Overview', path: '/customer/dashboard', icon: LayoutDashboard },
              { id: 'quotations', title: 'My Quotations', path: '/customer/quotations', icon: FolderKanban },
              { id: 'negotiation', title: 'Negotiations & Chat', path: '/customer/negotiation', icon: MessageSquare },
            ]
          },
          {
            heading: 'Orders & Billing',
            items: [
              { id: 'orders', title: 'My Orders', path: '/customer/orders', icon: ShoppingBag },
              { id: 'invoices', title: 'Invoices', path: '/customer/invoices', icon: Receipt },
            ]
          }
        ];
    }
  };

  const navGroups = getNavGroups();

  return (
    <div className="flex flex-col w-[260px] h-full bg-card/60 border-r border-border/50 p-3 font-sans select-none">
      {/* Workspace Switcher */}
      <WorkspaceSwitcher selected={activeWorkspace} onSelect={onWorkspaceSelect} role={role} />

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-1">
        {navGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-150
                    ${isActive
                      ? 'bg-primary/10 text-primary font-medium dark:bg-white/10 dark:text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground/90'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-[16px] h-[16px] shrink-0 transition-colors ${
                        isActive ? 'text-primary dark:text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground/70'
                      }`}
                      strokeWidth={1.75}
                    />
                    <span className="text-[13px] tracking-wide truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground/60 bg-background/50 border border-border/50 rounded-[4px] shadow-xs">
                        {item.shortcut}
                      </kbd>
                    )}
                    {item.badge && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Items */}
      <div className="mt-auto pt-3 border-t border-border/50 flex flex-col gap-1">
        <button
          onClick={onOpenSearch}
          className="group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <Hash className="w-[16px] h-[16px] text-muted-foreground/70" strokeWidth={1.75} />
            <span className="text-[13px]">Command Palette</span>
          </div>
          <kbd className="inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-mono text-muted-foreground/70 bg-background/50 border border-border/50 rounded-[4px]">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={logout}
          className="group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-[16px] h-[16px] text-muted-foreground/70 group-hover:text-rose-600 dark:group-hover:text-rose-400" strokeWidth={1.75} />
            <span className="text-[13px]">Log out</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function WorkspaceSwitcher({
  selected,
  onSelect,
  role
}: {
  selected?: string;
  onSelect?: (ws: string) => void;
  role: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = selected || 'DealFlow 360';
  const handleSelect = onSelect || (() => {});

  const workspaces = [
    'DealFlow 360',
    'Acme Global Corp',
    'Operations Center',
    'Enterprise Hub'
  ];

  const planLabel = role === 'CUSTOMER' ? 'Client Access' : 'Enterprise Plan';

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-2 mb-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors select-none group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-[6px] bg-primary text-primary-foreground flex items-center justify-center font-bold text-[13px] shadow-sm shrink-0">
            {current.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-medium leading-none mb-1 text-foreground truncate max-w-[130px]">
              {current}
            </span>
            <span className="text-[11px] text-muted-foreground leading-none">
              {planLabel}
            </span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors shrink-0" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-card border border-border/50 rounded-lg shadow-xl z-50 py-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            {workspaces.map((ws) => (
              <div 
                key={ws}
                onClick={() => {
                  handleSelect(ws);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors ${
                  current === ws ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {ws}
              </div>
            ))}
            <div className="h-px bg-border/50 my-1 mx-2" />
            <div className="px-3 py-1.5 mx-1 text-[12px] text-muted-foreground flex items-center justify-between">
              <span className="truncate">{role.replace('_', ' ')}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted">Active</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
