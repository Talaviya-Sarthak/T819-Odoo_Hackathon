import { 
  FileSpreadsheet, 
  ShieldAlert, 
  Sparkles, 
  Building2, 
  Layers, 
  MessageSquareQuote 
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: 'Intelligent Quotation',
    description:
      'Build line-item quotes with real-time gross margin calculation, dynamic price tiers, customer volume discounts, and jurisdiction tax compliance.',
  },
  {
    icon: ShieldAlert,
    title: 'Discount Governance',
    description:
      'Evaluate discount exceptions automatically against customer tiers and category thresholds, instantly routing high-risk margin deviations to managers.',
  },
  {
    icon: Sparkles,
    title: 'Intelligent Recommendations',
    description:
      'Surface contextual cross-sell and upsell recommendations dynamically in the quote builder to maximize deal value and improve gross profit margin.',
  },
  {
    icon: Building2,
    title: 'Multi-Warehouse Fulfillment',
    description:
      'Automatically split and allocate inventory across physical warehouse locations based on live stock availability, backorders, and regional transit.',
  },
  {
    icon: Layers,
    title: 'Hybrid Billing Models',
    description:
      'Combine one-time hardware purchases with monthly or annual software subscriptions in a single quotation and automated invoicing schedule.',
  },
  {
    icon: MessageSquareQuote,
    title: 'Customer Negotiation Portal',
    description:
      'Empower clients to review quotations, propose counter-discounts, and exchange clarification inquiries in an authenticated, quotation-scoped workspace.',
  },
];

export default function CoreFeatures() {
  return (
    <section id="features" className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Everything your deal needs, in one system.
          </h2>
          <p className="text-sm text-muted-foreground">
            From initial configure-price-quote to stock allocation and recurring revenue recognition.
          </p>
        </div>

        {/* 6 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-xl border border-border/60 bg-card/40 p-6 flex flex-col justify-between hover:border-border/90 hover:bg-card/70 transition-all duration-150 group"
              >
                <div className="space-y-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-foreground group-hover:text-primary transition-colors">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
