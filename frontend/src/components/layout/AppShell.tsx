import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { scheduleIdlePrefetch, cancelIdlePrefetch, queueHoverPrefetch, cancelHoverPrefetch } from '../../services/prefetch.service';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Search, 
  Command, 
  X, 
  ChevronDown,
  LogOut,
  ArrowRight,
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  ShoppingBag,
  CheckCircle2,
  Activity,
  Receipt,
  Boxes,
  Truck,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

const ROUTE_TITLES: Record<string, string> = {
  '/sales/dashboard': 'Sales Dashboard',
  '/sales/quotations': 'Quotation Kanban',
  '/sales/quote-builder': 'Quote Builder',
  '/sales/customers': 'Customer Accounts',
  '/sales/orders': 'Sales Orders',
  '/sales/ai-advisor': 'AI Deal Advisor',
  '/sales/discount-requests': 'Discount Requests',
  '/sales/approval-status': 'Approval Status',
  '/sales/negotiation': 'Negotiation Hub',

  '/management/dashboard': 'Management Overview',
  '/management/approvals': 'Pending Approvals Queue',
  '/management/deal-health': 'Deal Health & Alerts',
  '/management/analytics': 'Sales & Margin Analytics',
  '/management/reports': 'Executive Reports',
  '/management/products': 'Product Catalog',
  '/management/pricing': 'Pricing Rules',
  '/management/discount-rules': 'Discount Rules',
  '/management/approval-rules': 'Approval Rules',
  '/management/warehouses': 'Warehouses',
  '/management/subscriptions': 'Subscriptions',
  '/management/users': 'User Management',

  '/operations/dashboard': 'Operations Dashboard',
  '/operations/orders': 'Order Processing',
  '/operations/fulfillment': 'Fulfillment & Stock Allocation',
  '/operations/inventory': 'Inventory Tracking',
  '/operations/backorders': 'Backorders Management',
  '/operations/warehouses': 'Warehouses',
  '/operations/invoices': 'Invoices & Billing',
  '/operations/payments': 'Payments',
  '/operations/subscriptions': 'Recurring Subscriptions',

  '/customer/dashboard': 'Client Portal Dashboard',
  '/customer/quotations': 'My Quotations',
  '/customer/negotiation': 'Negotiation Center',
  '/customer/orders': 'My Orders',
  '/customer/invoices': 'Billing & Invoices',
  '/customer/payments': 'Payment History',
  '/customer/subscriptions': 'My Subscriptions',
};

const SEARCHABLE_ACTIONS = [
  { title: 'Sales Performance Dashboard', path: '/sales/dashboard', category: 'Sales', icon: LayoutDashboard },
  { title: 'Quotation Kanban Board', path: '/sales/quotations', category: 'Sales', icon: FolderKanban },
  { title: 'Create New Quotation', path: '/sales/quote-builder', category: 'Sales', icon: FileText },
  { title: 'Customer Accounts', path: '/sales/customers', category: 'Sales', icon: Users },
  { title: 'Sales Orders', path: '/sales/orders', category: 'Sales', icon: ShoppingBag },
  { title: 'Pending Approvals Queue', path: '/management/approvals', category: 'Management', icon: CheckCircle2 },
  { title: 'Deal Health & Risk Monitoring', path: '/management/deal-health', category: 'Management', icon: Activity },
  { title: 'Operations Dashboard', path: '/operations/dashboard', category: 'Operations', icon: LayoutDashboard },
  { title: 'Fulfillment & Shipments', path: '/operations/fulfillment', category: 'Operations', icon: Truck },
  { title: 'Inventory Levels', path: '/operations/inventory', category: 'Operations', icon: Boxes },
  { title: 'Invoices & Collections', path: '/operations/invoices', category: 'Finance', icon: Receipt },
  { title: 'Negotiations & Chat', path: '/customer/negotiation', category: 'Customer', icon: MessageSquare },
];

const ROLE_BADGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SALES_MANAGER: {
    label: 'Sales Manager',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/25',
  },
  SALES_REP: {
    label: 'Sales Rep',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/25',
  },
  FINANCE: {
    label: 'Finance',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/25',
  },
  ADMIN: {
    label: 'Admin',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/25',
  },
  MANAGER_ADMIN: {
    label: 'Admin',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/25',
  },
  OPERATIONS: {
    label: 'Operations',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
  },
  CUSTOMER: {
    label: 'Customer',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/25',
  },
};

interface AppShellProps {
  portalName?: string;
}

export default function AppShell({ portalName }: AppShellProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const roleMeta = (user?.role && ROLE_BADGE_CONFIG[user.role]) || {
    label: user?.role?.replace('_', ' ') || 'User',
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  };

  const [isOpen, setIsOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWorkspace, setActiveWorkspace] = useState(portalName || 'DealFlow 360');

  // Determine current active page title
  const currentPath = location.pathname;
  const activeTitle = ROUTE_TITLES[currentPath] || 
    Object.entries(ROUTE_TITLES).find(([path]) => currentPath.startsWith(path))?.[1] || 
    'Dashboard';

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Intelligent idle prefetch: after landing on a route, prefetch logically related pages in the background
  useEffect(() => {
    scheduleIdlePrefetch(location.pathname, user);
    return () => {
      cancelIdlePrefetch();
    };
  }, [location.pathname, user]);

  const filteredActions = SEARCHABLE_ACTIONS.filter(action =>
    action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Collapsible Sidebar */}
      <div 
        className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-card/50 border-r border-border/50 ${
          isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'
        }`}
      >
        <Sidebar 
          activeWorkspace={activeWorkspace}
          onWorkspaceSelect={setActiveWorkspace}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      </div>

      {/* Main App Container */}
      <div className="flex-1 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col min-w-0 transition-all duration-300 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border/50 flex items-center px-4 justify-between bg-card/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
              title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground overflow-hidden whitespace-nowrap">
              <span className="truncate font-normal">{activeWorkspace}</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-medium text-foreground truncate">{activeTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Search Bar Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center justify-between w-64 h-8 px-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/8 rounded-md border border-border/40 text-muted-foreground text-[12px] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground/70" strokeWidth={1.5} />
                <span>Search or jump to...</span>
              </div>
              <kbd className="inline-flex items-center justify-center h-4 px-1 text-[10px] font-mono text-muted-foreground/70 bg-card border border-border/50 rounded-[3px]">
                ⌘K
              </kbd>
            </button>

            {/* User Profile & Role Badge */}
            <div className="flex items-center pl-2 border-l border-border/40">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-border/50 bg-card/50 transition-all cursor-pointer select-none group focus:outline-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>

                    <span className="text-[12px] font-medium text-foreground leading-none truncate max-w-[120px]">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </span>

                    <span className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md border ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border} leading-none`}>
                      {roleMeta.label}
                    </span>

                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground transition-transform ml-0.5" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 p-1.5 bg-card border border-border/60 shadow-2xl rounded-xl z-50">
                  <div className="px-2.5 py-2">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {user?.name || 'User Account'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                      {user?.email || 'user@dealflow360.com'}
                    </p>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Active Portal</span>
                    <span className="font-medium text-foreground">{activeWorkspace}</span>
                  </div>

                  <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Role</span>
                    <span className={`font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded border ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border}`}>
                      {roleMeta.label}
                    </span>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <Command className="w-3.5 h-3.5" />
                      Quick Search
                    </span>
                    <kbd className="text-[10px] font-mono opacity-60">⌘K</kbd>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-track]:bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette / Search Dialog Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/50 backdrop-blur-sm px-4">
          <div className="fixed inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-10">
            <div className="flex items-center px-4 border-b border-border/50">
              <Search className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0" strokeWidth={1.5} />
              <input 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent py-3.5 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
                placeholder="Search deals, quotations, pages, or actions..."
              />
              <kbd 
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground/70 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-[4px] cursor-pointer hover:text-foreground hover:bg-black/10 transition-colors"
              >
                ESC
              </kbd>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2">
              {filteredActions.length === 0 ? (
                <div className="p-6 py-8 flex flex-col items-center justify-center text-center">
                  <Command className="w-6 h-6 text-muted-foreground/30 mb-2" strokeWidth={1.5} />
                  <p className="text-[13px] text-muted-foreground font-medium">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Navigation & Quick Links
                  </div>
                  {filteredActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={action.path}
                        onMouseEnter={() => queueHoverPrefetch(action.path, user)}
                        onMouseLeave={cancelHoverPrefetch}
                        onClick={() => {
                          navigate(action.path);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                            <Icon className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <div>
                            <span className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">
                              {action.title}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {action.category}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Navigate with click or shortcuts</span>
              <span>DealFlow 360 Workspace</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
