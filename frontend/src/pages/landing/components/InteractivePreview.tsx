import { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Truck, 
  Receipt, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Boxes,
  User,
  AlertTriangle
} from 'lucide-react';

const TABS = [
  { id: 'sales', label: 'Quote Builder', icon: FileText },
  { id: 'approvals', label: 'Approvals Queue', icon: ShieldCheck },
  { id: 'fulfillment', label: 'Fulfillment & Stock', icon: Truck },
  { id: 'billing', label: 'Hybrid Invoicing', icon: Receipt },
  { id: 'negotiation', label: 'Customer Negotiation', icon: MessageSquare },
  { id: 'analytics', label: 'Deal Health', icon: TrendingUp },
];

export default function InteractivePreview() {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <section id="platform" className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Product Walkthrough
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            A cohesive system built for real operations.
          </h2>
          <p className="text-sm text-muted-foreground">
            Explore how DealFlow360 handles each stage of the B2B sales lifecycle.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-xl border border-border/60 bg-card/40 max-w-3xl mx-auto mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Preview Frame Container */}
        <div className="max-w-5xl mx-auto rounded-xl border border-border/70 bg-card/60 p-2 shadow-2xl backdrop-blur-xs">
          {/* Top Frame Bar */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/40 text-xs text-muted-foreground mb-3 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="ml-2 text-muted-foreground/80">dealflow360.internal/sales/{activeTab}</span>
            </div>
            <span className="text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">Enterprise Mode</span>
          </div>

          {/* Dynamic Content Panel */}
          <div className="rounded-lg border border-border/50 bg-background/90 p-5 sm:p-7 min-h-[380px] flex flex-col justify-center">
            {activeTab === 'sales' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Interactive Quotation Builder</h4>
                    <p className="text-xs text-muted-foreground">Configuring QUO-2026-0842 for Apex Global Systems</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 rounded">
                    Margin: 28.4% (Healthy)
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-12 font-semibold text-muted-foreground border-b border-border/30 pb-2">
                    <span className="col-span-5">Product & SKU</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Unit Price</span>
                    <span className="col-span-3 text-right">Net Subtotal</span>
                  </div>
                  <div className="grid grid-cols-12 py-2 items-center">
                    <span className="col-span-5 font-semibold text-foreground">Fiber Switch Core Gateway (400G)</span>
                    <span className="col-span-2 text-center font-mono">10</span>
                    <span className="col-span-2 text-right font-mono text-muted-foreground">$4,200.00</span>
                    <span className="col-span-3 text-right font-mono font-semibold text-foreground">$42,000.00</span>
                  </div>
                  <div className="grid grid-cols-12 py-2 items-center border-t border-border/30">
                    <span className="col-span-5 font-semibold text-foreground">Cloud Management Suite (Annual)</span>
                    <span className="col-span-2 text-center font-mono">1</span>
                    <span className="col-span-2 text-right font-mono text-muted-foreground">$8,500.00</span>
                    <span className="col-span-3 text-right font-mono font-semibold text-foreground">$8,500.00</span>
                  </div>
                </div>

                <div className="rounded border border-border/40 bg-muted/20 p-3 flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Auto-Governance Check:</span>
                  <span className="text-foreground font-medium">Within tier discount ceiling • No manager sign-off required</span>
                </div>
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Executive Approvals Queue</h4>
                    <p className="text-xs text-muted-foreground">1 deal requiring Sales Manager delegation</p>
                  </div>
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                    1 Pending Action
                  </span>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground text-sm">QUO-2026-0842 — Apex Global Systems</p>
                      <p className="text-muted-foreground">Rep: Sarah Jenkins • Requested Discount: <strong className="text-amber-400">14.0%</strong> (Ceiling: 10%)</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs">
                        Approve Deal
                      </button>
                      <button className="px-3 py-1 border border-border/60 hover:bg-card text-muted-foreground rounded text-xs">
                        Return
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                    Risk Assessment: Deal total is $84,250 with healthy 28.4% gross margin. Tier 1 customer renewal commitment provided.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fulfillment' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Multi-Warehouse Allocation Hub</h4>
                    <p className="text-xs text-muted-foreground">Automated stock routing for Sales Order SO-2026-0419</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">100% Stock Reserved</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded border border-border/50 bg-card/40 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Central Logistics Hub</span>
                    <p className="text-sm font-bold text-foreground">12 units allocated</p>
                    <span className="text-emerald-400 text-[11px] block">Dispatched via Courier</span>
                  </div>
                  <div className="rounded border border-border/50 bg-card/40 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">East Coast Depot</span>
                    <p className="text-sm font-bold text-foreground">8 units allocated</p>
                    <span className="text-emerald-400 text-[11px] block">Packing in Progress</span>
                  </div>
                  <div className="rounded border border-border/50 bg-card/40 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Backorder Queue</span>
                    <p className="text-sm font-bold text-foreground">0 backorders</p>
                    <span className="text-muted-foreground text-[11px] block">All lines fulfilled</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Hybrid Invoicing Schedule</h4>
                    <p className="text-xs text-muted-foreground">Unified ledger handling capital products and SaaS subscriptions</p>
                  </div>
                  <span className="text-xs font-mono text-foreground font-semibold">Total: $50,500</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded border border-border/40 bg-card/30 p-3 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-foreground">INV-2026-0081 (Hardware Shipment)</span>
                      <span className="block text-[11px] text-muted-foreground">One-Time Capital Purchase • Due in 30 days</span>
                    </div>
                    <span className="font-mono font-bold text-foreground text-sm">$42,000.00</span>
                  </div>

                  <div className="rounded border border-border/40 bg-card/30 p-3 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-foreground">SUB-2026-0012 (24/7 Managed NOC)</span>
                      <span className="block text-[11px] text-emerald-400">Monthly Recurring • Next billing: 1st of month</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">$1,200.00 / mo</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'negotiation' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Live Customer Negotiation Hub</h4>
                    <p className="text-xs text-muted-foreground">Authenticated thread linked directly to Quotation QUO-2026-0842</p>
                  </div>
                  <span className="text-xs font-medium text-purple-400">1 Counter-Discount Pending</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-card/40 border border-border/50">
                    <p className="text-muted-foreground font-medium text-[11px]">Client Counter-Offer:</p>
                    <p className="text-foreground mt-0.5">"Requesting 12.0% discount for commitment to a 3-year term agreement."</p>
                    <span className="text-amber-400 text-[10px] block mt-1">Submitted for Governance Evaluation</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Executive Deal Health & Velocity</h4>
                    <p className="text-xs text-muted-foreground">Real-time indicators across all active pipeline stages</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">Average Velocity: 6.2 Days</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded border border-border/50 bg-card/40 p-3 space-y-1">
                    <span className="text-muted-foreground">Pipeline Health Score</span>
                    <p className="text-lg font-bold text-foreground">94 / 100</p>
                    <span className="text-emerald-400 text-[11px] block">High probability of close</span>
                  </div>
                  <div className="rounded border border-border/50 bg-card/40 p-3 space-y-1">
                    <span className="text-muted-foreground">Average Realized Margin</span>
                    <p className="text-lg font-bold text-emerald-400">29.1%</p>
                    <span className="text-muted-foreground text-[11px] block">+2.3% above targets</span>
                  </div>
                  <div className="rounded border border-border/50 bg-card/40 p-3 space-y-1">
                    <span className="text-muted-foreground">Stalled Deal Risk</span>
                    <p className="text-lg font-bold text-foreground">0 Deals</p>
                    <span className="text-muted-foreground text-[11px] block">All proposals active</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
