import { ShieldCheck, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DiscountGovernanceSection() {
  return (
    <section id="governance" className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Explanatory Copy */}
          <div className="space-y-5 text-left">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Discount Governance Engine
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Protect margin without slowing sales.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              DealFlow360 evaluates discounts against customer and category-specific rules, automatically routing higher-risk deals to the appropriate approvers while allowing standard proposals to clear instantly.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Tier-Specific Ceilings:</strong> Tier 1 Enterprise (up to 15%), Tier 2 Mid-Market (up to 10%), Standard (up to 5%).
                </span>
              </div>
              <div className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Multi-Step Delegation:</strong> Minor deviations route to Sales Managers; heavy concessions require Finance sign-off.
                </span>
              </div>
              <div className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Tamper-Proof Audit Trail:</strong> Every approval, note, and rejection timestamped for executive governance.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Clean Governance Routing Visual */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Automated Governance Flow
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Rule Engine Active
              </span>
            </div>

            {/* Visual Step Tree */}
            <div className="space-y-3">
              {/* Inputs */}
              <div className="rounded-lg border border-border/50 bg-background/60 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Inputs Evaluated</span>
                  <span className="font-semibold text-foreground">Tier 1 • Enterprise Routers • 14% Discount</span>
                </div>
                <span className="text-[11px] font-mono text-foreground/80 bg-muted/40 px-2 py-0.5 rounded border border-border/50">
                  Ceiling: 10%
                </span>
              </div>

              <div className="flex justify-center text-muted-foreground/40 text-xs font-mono">↓</div>

              {/* Risk Evaluation */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-amber-400 block text-[11px] font-semibold uppercase tracking-wider">Risk Evaluation</span>
                  <span className="text-foreground font-medium">Margin Deviation: +4% over tier limit</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-md">
                  Medium Risk (50/100)
                </span>
              </div>

              <div className="flex justify-center text-muted-foreground/40 text-xs font-mono">↓</div>

              {/* Approval Routing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-background/60 p-3 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Step 1</span>
                  <p className="font-semibold text-foreground">Sales Manager</p>
                  <span className="text-[11px] text-emerald-400 block">Approved (2m ago)</span>
                </div>

                <div className="rounded-lg border border-border/50 bg-background/60 p-3 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Step 2</span>
                  <p className="font-semibold text-foreground">Finance Operations</p>
                  <span className="text-[11px] text-amber-400 block">Review in Queue</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
