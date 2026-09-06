import { Bot, Sparkles, CheckCircle2, Search, Database } from 'lucide-react';

export default function AISection() {
  return (
    <section className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Explanatory Copy */}
          <div className="space-y-5 text-left order-1">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              RAG Knowledge Assistant
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Answers when customers need them.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get instant answers to product specifications, quotation terms, shipment tracking, billing cycles, subscription renewals, and support policies through an AI customer assistant grounded in your company's actual knowledge base.
            </p>

            <div className="space-y-3 pt-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Grounded in Knowledge Documents:</strong> Powered by your curated company documentation, FAQs, and product manuals.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Cross-Portal Accessibility:</strong> Available to clients in the Customer Portal and internal operators across all operational workflows.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Strict Hallucination Guards:</strong> Answers only from verified repository content with source citations.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Minimal AI Chatbot UI Mockup */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 space-y-4 order-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground">DealFlow360 Assistant</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <Database className="h-3 w-3" /> Vector RAG
              </span>
            </div>

            {/* Chat Conversation */}
            <div className="space-y-3 text-xs">
              <div className="flex flex-col items-end space-y-1">
                <div className="max-w-xs rounded-xl bg-foreground text-background px-3.5 py-2 font-medium">
                  "How can I track the partial delivery for my router order?"
                </div>
              </div>

              <div className="flex flex-col items-start space-y-1">
                <div className="max-w-sm rounded-xl border border-border/50 bg-background/80 p-3.5 space-y-2 text-foreground leading-relaxed">
                  <p>
                    Your shipment for Order <span className="font-mono text-xs font-semibold">SO-2026-0419</span> has been split across two fulfillment centers:
                  </p>
                  <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                    <li><strong className="text-foreground">12 units</strong> shipped from Central Hub (Tracking: <span className="font-mono text-foreground">TRK-89214</span>)</li>
                    <li><strong className="text-foreground">8 units</strong> preparing at East Depot</li>
                  </ul>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                    Source: Verified via Sales Order & Warehouse Records.
                  </p>
                </div>
              </div>
            </div>

            {/* Input placeholder */}
            <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2 border border-border/30">
              <span>Ask about products, orders, or policies...</span>
              <kbd className="font-mono text-[10px] bg-card border border-border/50 px-1 rounded">↵</kbd>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
