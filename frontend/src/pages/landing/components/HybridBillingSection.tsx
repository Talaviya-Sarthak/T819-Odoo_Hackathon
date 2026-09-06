import { Receipt, Repeat, CreditCard, CheckCircle2 } from 'lucide-react';

export default function HybridBillingSection() {
  return (
    <section className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Explanatory Copy */}
          <div className="space-y-5 text-left">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Hybrid Billing Engine
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
              One order. Multiple billing models.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Modern enterprise sales bundles physical equipment, perpetual licenses, and recurring SaaS contracts together. DealFlow360 unites one-time and recurring revenues into a single unified order while generating accurate, segregated billing schedules.
            </p>

            <div className="space-y-3 pt-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Unified Deal Total:</strong> Present clear upfront total commitments without obscuring recurring cadences.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Automated Invoice Triggers:</strong> Hardware invoices upon fulfillment; subscriptions generate on renewal cycles.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Customer Visibility:</strong> Portal shows separate balances, payment history, and auto-renew dates clearly.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Minimal Hybrid Order Visual */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Receipt className="h-4 w-4 text-primary" />
                <span>Consolidated Deal Invoice Schedule</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">Order: SO-2026-092</span>
            </div>

            {/* Billing Items Breakdown */}
            <div className="space-y-3 text-xs">
              {/* One-Time Item */}
              <div className="rounded-lg border border-border/50 bg-background/60 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    One-Time Purchase
                  </span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">Enterprise Hardware Rack System</p>
                  <span className="text-[11px] text-muted-foreground">Billed once on shipment delivery</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-foreground">$48,000.00</span>
                  <span className="block text-[10px] text-muted-foreground">Paid Upfront</span>
                </div>
              </div>

              <div className="flex justify-center text-muted-foreground/40 text-xs font-mono">+</div>

              {/* Monthly Subscription */}
              <div className="rounded-lg border border-border/50 bg-background/60 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block">
                    Monthly Subscription
                  </span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">24/7 Managed NOC Support Plan</p>
                  <span className="text-[11px] text-muted-foreground">Autorenew on 1st of each month</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-emerald-400">$1,200.00 <span className="text-xs font-normal">/mo</span></span>
                  <span className="block text-[10px] text-muted-foreground">12-Month Contract</span>
                </div>
              </div>

              <div className="flex justify-center text-muted-foreground/40 text-xs font-mono">+</div>

              {/* Yearly Subscription */}
              <div className="rounded-lg border border-border/50 bg-background/60 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block">
                    Annual Cloud Contract
                  </span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">Cloud Telemetry & Diagnostics License</p>
                  <span className="text-[11px] text-muted-foreground">Billed annually in advance</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-purple-400">$8,500.00 <span className="text-xs font-normal">/yr</span></span>
                  <span className="block text-[10px] text-muted-foreground">Auto-Invoiced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
