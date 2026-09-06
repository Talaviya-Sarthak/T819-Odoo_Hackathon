import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28 border-t border-border/50 bg-card/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          Run every deal with clarity.
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Bring pricing, approvals, fulfillment, billing, negotiation, and customer intelligence into one connected workflow.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
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
            Explore the Platform
          </a>
        </div>
      </div>
    </section>
  );
}
