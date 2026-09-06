import { Activity, AlertTriangle, Sparkles, TrendingDown, ArrowUpRight } from 'lucide-react';

export default function IntelligenceSection() {
  return (
    <section id="intelligence" className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Embedded Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Every deal has a signal. DealFlow360 helps you see it.
          </h2>
          <p className="text-sm text-muted-foreground">
            Proactive risk monitoring, pricing governance, and catalog cross-sell suggestions built directly into sales operations.
          </p>
        </div>

        {/* Three Intelligence Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Deal Health */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-foreground">
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-[11px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Score: 88 / 100
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">Deal Health Monitoring</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tracks sales velocity, inactive quote age, customer credit rating, and negotiation stagnation to flag at-risk opportunities before they stall.
              </p>
            </div>

            {/* Minimal Metric Visual */}
            <div className="rounded-lg border border-border/40 bg-background/50 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Stagnation Velocity:</span>
                <span className="text-foreground font-medium">3 days in review (Normal)</span>
              </div>
              <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full w-[85%]" />
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                <span>Churn Risk: Low</span>
                <span className="text-emerald-400 font-semibold">92% Win Probability</span>
              </div>
            </div>
          </div>

          {/* 2. Discount Anomalies */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-[11px] font-mono text-amber-400 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded">
                  Deviation Alert
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">Discount Anomalies</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Surfaces unusual discount patterns across customer tiers, sales reps, and product categories to prevent unapproved margin erosion.
              </p>
            </div>

            {/* Minimal Metric Visual */}
            <div className="rounded-lg border border-border/40 bg-background/50 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Requested: 18.5%</span>
                <span className="text-amber-400 font-mono font-medium">+3.5% over policy</span>
              </div>
              <div className="rounded border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-400">
                L2 Regional Manager approval required before customer proposal dispatch.
              </div>
            </div>
          </div>

          {/* 3. Catalog Recommendations */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-mono text-foreground border border-border/60 bg-muted/40 px-2 py-0.5 rounded">
                  Revenue Lift
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">Intelligent Cross-Sell</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Recommends complementary components, extended warranties, and recurring service packs based on existing line-items in the active quote.
              </p>
            </div>

            {/* Minimal Metric Visual */}
            <div className="rounded-lg border border-border/40 bg-background/50 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-foreground font-medium">
                <span>3-Year Enterprise Care Pack</span>
                <span className="text-emerald-400 font-mono">+$4,200</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                94% attachment rate with Enterprise Core Gateway models.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
