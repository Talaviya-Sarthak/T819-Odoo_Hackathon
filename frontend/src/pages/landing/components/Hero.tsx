import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Boxes, 
  MessageSquare,
  Sparkles,
  CreditCard
} from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tag */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-2xs backdrop-blur-xs mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Intelligent Sales Operations Platform</span>
          </div>
        </div>

        {/* Hero Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
            The intelligent operating system for modern B2B sales.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal">
            From quotation to approval, fulfillment, billing, and negotiation — DealFlow360 brings the entire deal lifecycle into one governed, intelligent workspace.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors shadow-xs"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#platform"
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors shadow-2xs"
            >
              Explore Platform
            </a>
          </div>

          {/* Trust Statement */}
          <p className="text-xs text-muted-foreground/80 font-medium pt-2">
            Built for complex B2B sales workflows.
          </p>
        </div>

        {/* Hero Product Visual Mockup */}
        <div className="mt-14 sm:mt-18 max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-border/70 bg-card/80 p-2 shadow-2xl backdrop-blur-xs">
            {/* Top Mock Window Bar */}
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/40 mb-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-border/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-border/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-border/80" />
                <span className="ml-2 font-mono text-[11px] text-muted-foreground/70">app.dealflow360.com/sales/quotations/QUO-2026-0842</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" /> Live Deal
                </span>
              </div>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="rounded-xl border border-border/50 bg-background/90 p-4 sm:p-6 space-y-5 text-left">
              {/* Deal Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      Apex Global Systems — Cloud Infrastructure Expansion
                    </h3>
                    <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                      QUO-2026-0842
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Customer Tier: <span className="text-foreground font-semibold">Tier 1 Enterprise</span> • Sales Rep: <span className="text-foreground font-medium">Sarah Jenkins</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Manager Review Pending
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-1 text-xs font-semibold text-foreground">
                    <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                    Portal Chat Active
                  </span>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Grand Total</span>
                  <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight">$84,250.00</p>
                  <span className="text-[11px] text-muted-foreground/80">Tax & shipping included</span>
                </div>

                <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Projected Margin</span>
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg sm:text-xl font-bold text-emerald-400 tracking-tight">28.4%</p>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-[11px] text-emerald-400/80">+$23,927.00 profit</span>
                </div>

                <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Discount Governance</span>
                  <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight">12.0%</p>
                  <span className="text-[11px] text-amber-400">Ceiling: 10% (Requires L2)</span>
                </div>

                <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Deal Health</span>
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Score: 92</p>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[11px] text-muted-foreground/80">High velocity • Low churn risk</span>
                </div>
              </div>

              {/* Line Items & Multi-Warehouse Allocation Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
                {/* Left: Product Line Items */}
                <div className="lg:col-span-2 rounded-lg border border-border/50 bg-card/40 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border/30 pb-2">
                    <span>Configured Items</span>
                    <span>Pricing Model</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="font-semibold text-foreground">Edge Router Pro X800 (10 units)</p>
                        <p className="text-[11px] text-muted-foreground">SKU: ERP-X800 • One-Time Hardware</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-foreground">$42,000.00</span>
                        <span className="block text-[10px] text-muted-foreground">8% Tier Discount</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-t border-border/30">
                      <div>
                        <p className="font-semibold text-foreground">Enterprise 24/7 SLA Support Plan</p>
                        <p className="text-[11px] text-muted-foreground">Monthly Recurring Subscription</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-foreground">$1,250.00 / mo</span>
                        <span className="block text-[10px] text-emerald-400">Recurring Schedule</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-t border-border/30">
                      <div>
                        <p className="font-semibold text-foreground">Optic Fiber Switch Modules (40 units)</p>
                        <p className="text-[11px] text-muted-foreground">SKU: OPT-400G • Split Warehouse Delivery</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-foreground">$24,000.00</span>
                        <span className="block text-[10px] text-muted-foreground">Allocated</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Operational Pipeline Snapshot */}
                <div className="rounded-lg border border-border/50 bg-card/40 p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground border-b border-border/30 pb-2">
                    <Boxes className="h-3.5 w-3.5 text-primary" />
                    <span>Fulfillment & Billing</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Central Warehouse:</span>
                      <span className="font-semibold text-foreground">35 units ready</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">East Coast Depot:</span>
                      <span className="font-semibold text-foreground">15 units ready</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Backorders:</span>
                      <span className="font-medium text-muted-foreground">0 pending</span>
                    </div>
                    <div className="border-t border-border/30 pt-2 flex justify-between">
                      <span className="text-muted-foreground">Invoice Type:</span>
                      <span className="font-semibold text-foreground">Hybrid (One-time + Rec)</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Stock reserved for 7 business days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
