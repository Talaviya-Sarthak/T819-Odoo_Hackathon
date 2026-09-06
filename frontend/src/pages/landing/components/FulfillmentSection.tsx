import { Building2, CheckCircle2, Clock, Truck, ArrowRight } from 'lucide-react';

export default function FulfillmentSection() {
  return (
    <section className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Warehouse Tree Visual */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 space-y-6 order-2 lg:order-1">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stock Allocation Breakdown
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                SO-2026-0419 • 23 Units Total
              </span>
            </div>

            {/* Tree Structure */}
            <div className="space-y-3 font-mono text-xs">
              <div className="rounded-lg border border-border/50 bg-background/60 p-3 flex items-center justify-between">
                <span className="font-semibold text-foreground">ORDER: Enterprise Gateway Hubs</span>
                <span className="text-muted-foreground">23 Total Requested</span>
              </div>

              <div className="pl-4 space-y-2 border-l border-border/50 ml-3">
                <div className="rounded-lg border border-border/50 bg-background/40 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-foreground">Main Distribution Hub</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">12 units allocated</span>
                </div>

                <div className="rounded-lg border border-border/50 bg-background/40 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-foreground">East Coast Depot</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">8 units allocated</span>
                </div>

                <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-amber-300">Automated Backorder</span>
                  </div>
                  <span className="text-amber-400 font-semibold">3 units pending restock</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>Automatic split strategy: <strong className="text-foreground">Optimal Proximity</strong></span>
              <span className="text-emerald-400 font-medium">Ready for Dispatch</span>
            </div>
          </div>

          {/* Right: Explanatory Copy */}
          <div className="space-y-5 text-left order-1 lg:order-2">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Multi-Warehouse Operations
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Sell what you can actually fulfill.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              DealFlow360 connects quotation lines directly to live inventory records. Orders are automatically allocated across available warehouses based on real-time stock levels, with shortfalls converted to tracked backorders.
            </p>

            <div className="space-y-3 pt-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Multi-Site Allocation:</strong> Split single order line-items across multiple depots without breaking invoicing.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Automated Backorders:</strong> Automatically tracks stock shortages and reserves arriving purchase orders.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Manual Override Control:</strong> Operations personnel can re-route deliveries or override stock assignments on demand.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
