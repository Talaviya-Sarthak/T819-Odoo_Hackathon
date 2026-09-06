import { MessageSquare, CheckCircle2, ArrowRight, Clock, ShieldCheck } from 'lucide-react';

export default function NegotiationSection() {
  return (
    <section className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Minimal Conversation Interface Mockup */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Deal Collaboration • QUO-2026-0842</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Real-Time Channel
              </span>
            </div>

            {/* Conversation Flow */}
            <div className="space-y-3.5 text-xs">
              {/* Customer Message */}
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Mark Taylor (Client Procurement)</span>
                  <span>•</span>
                  <span>10:24 AM</span>
                </div>
                <div className="max-w-sm rounded-2xl rounded-tl-sm border border-border/50 bg-background/80 px-4 py-2.5 text-foreground leading-relaxed">
                  "Can we get a better price on the Enterprise Support package if we commit to a 3-year term?"
                </div>
              </div>

              {/* Sales Rep Response */}
              <div className="flex flex-col items-end space-y-1">
                <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Sarah Jenkins (Sales Representative)</span>
                  <span>•</span>
                  <span>10:26 AM</span>
                </div>
                <div className="max-w-sm rounded-2xl rounded-tr-sm bg-foreground text-background px-4 py-2.5 leading-relaxed font-medium">
                  "I can offer 12% on the multi-year support plan. Submitting the counter-discount to management now."
                </div>
              </div>

              {/* System Governance Notice */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300 flex items-start gap-2.5 text-[11px]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold block">System: Approval Request Submitted</span>
                  <span>12% discount exceeds tier threshold. Routed to Sales Manager for review.</span>
                </div>
              </div>
            </div>

            {/* Workflow Process Bar */}
            <div className="border-t border-border/40 pt-4 grid grid-cols-4 gap-2 text-center text-[11px] text-muted-foreground font-medium">
              <div className="rounded bg-muted/30 py-1 text-foreground font-semibold">1. Negotiate</div>
              <div className="rounded bg-muted/30 py-1 text-foreground font-semibold">2. Review</div>
              <div className="rounded bg-muted/30 py-1 text-foreground font-semibold">3. Approve</div>
              <div className="rounded bg-muted/30 py-1 text-foreground font-semibold">4. Confirm</div>
            </div>
          </div>

          {/* Right: Explanatory Copy */}
          <div className="space-y-5 text-left">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Customer Negotiation Center
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Turn negotiation into a workflow, not an email thread.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Customers can review quotations, ask line-level questions, request term adjustments, propose counter-discounts, and confirm agreements through a dedicated client portal.
            </p>

            <div className="space-y-3 pt-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Quotation-Scoped Rooms:</strong> Every conversation is linked to the exact quote version and line items.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Instant Real-Time Sync:</strong> Messages and counter-offers update instantaneously without refreshing pages.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">One-Click Acceptance:</strong> When terms are agreed, customer confirmation immediately transitions the quote into order fulfillment.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
