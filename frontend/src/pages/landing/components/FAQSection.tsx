import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: 'What is DealFlow360?',
    answer:
      'DealFlow360 is an Intelligent Sales Operations Platform designed for complex B2B sales cycles. It unifies quotation creation, margin visibility, discount governance, customer negotiation, multi-warehouse stock allocation, hybrid billing, and deal health tracking into one governed workspace.',
  },
  {
    question: 'Can customers negotiate quotations directly?',
    answer:
      'Yes. Through a dedicated, authenticated Customer Portal, clients can review detailed quotation terms, submit counter-discount requests with justifications, and communicate directly with their assigned sales representative.',
  },
  {
    question: 'How does discount approval work?',
    answer:
      'Discounts are evaluated against predefined customer tier ceilings and product category rules. When a sales rep or customer proposes a discount beyond allowed limits, the platform automatically flags the risk and routes the deal into a multi-step approval queue for Sales Managers and Finance.',
  },
  {
    question: 'Can an order be fulfilled from multiple warehouses?',
    answer:
      'Yes. DealFlow360 supports automated inventory splitting. When an order is confirmed, the system evaluates available stock across your warehouse network and allocates quantities to the optimal fulfillment centers, while converting unfulfilled quantities into tracked backorders.',
  },
  {
    question: 'Can one order contain subscriptions and one-time products?',
    answer:
      'Yes. DealFlow360 features a hybrid billing engine. You can include capital hardware, perpetual licenses, and recurring SaaS or support subscriptions in the same quotation. Upon confirmation, the system creates distinct billing schedules and automated recurring invoices.',
  },
  {
    question: 'Can customers communicate directly with sales representatives in real time?',
    answer:
      'Yes. Every quotation features an authenticated, quotation-scoped communication thread with real-time message delivery, live typing indicators, and counter-offer tracking so negotiations occur inside a governed workflow instead of scattered email threads.',
  },
  {
    question: 'Does DealFlow360 support customer-service AI?',
    answer:
      'Yes. DealFlow360 features an embedded customer service assistant powered by Retrieval-Augmented Generation (RAG). It answers customer inquiries regarding product specs, active orders, tracking, invoices, and company policies grounded strictly in your curated knowledge repository.',
  },
  {
    question: 'How does quotation approval work?',
    answer:
      'Quotations with excessive discounts or special terms enter a Pending Approval stage. Authorized Sales Managers or Finance approvers review the deal context, customer tier history, and projected margins to approve, reject, or return the quote with revisions in a single click.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 space-y-3">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Questions & Answers
          </h2>
          <p className="text-sm text-muted-foreground">
            Clear technical details on how DealFlow360 operates.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border/60 bg-card/40 transition-colors overflow-hidden"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-foreground hover:text-foreground/90 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-foreground' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3 animate-in fade-in duration-150">
                    {faq.answer}
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
