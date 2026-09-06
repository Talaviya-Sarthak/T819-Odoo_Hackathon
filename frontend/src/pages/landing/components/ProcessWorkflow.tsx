import { FileText, ShieldCheck, Truck, Receipt, MessageSquare } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Intelligent Quotation',
    desc: 'Configure product lines, tiered pricing, discounts, and real-time margin visibility.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'Discount Governance',
    desc: 'Automated policy evaluation routing margin exceptions to managers & finance.',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: 'Customer Negotiation',
    desc: 'Dedicated customer portal for counter-offers, line-item discussions, and approval.',
    icon: MessageSquare,
  },
  {
    step: '04',
    title: 'Multi-Warehouse Stock',
    desc: 'Automatic warehouse allocation, stock reservations, and automated backorders.',
    icon: Truck,
  },
  {
    step: '05',
    title: 'Hybrid Billing & Ledger',
    desc: 'Combined invoices for one-time capital items and recurring subscriptions.',
    icon: Receipt,
  },
];

export default function ProcessWorkflow() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Connected Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Sales gets complicated. Your workflow shouldn't.
          </h2>
          <p className="text-sm text-muted-foreground">
            DealFlow360 connects quotation creation, governance, fulfillment, and collections into a unified operating model.
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative rounded-xl border border-border/60 bg-card/40 p-5 flex flex-col justify-between hover:border-border transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-semibold text-muted-foreground/80">
                      {s.step}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-foreground group-hover:text-primary transition-colors">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                {idx < STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/30 font-mono text-xs">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
