import { logger } from '../../../config/logger';
import { knowledgeIngestionService } from '../knowledge.ingestion';

export const DEALFLOW360_KNOWLEDGE_TEXT = `
DEALFLOW360 ENTERPRISE PLATFORM & CUSTOMER CAPABILITIES GUIDE

CHAPTER 1: PLATFORM OVERVIEW
DealFlow360 is an intelligent Quote-to-Cash, B2B CPQ (Configure, Price, Quote), Governance, and Omnichannel Sales Platform.
It bridges sales representatives, approval managers, finance teams, operations/fulfillment, and enterprise customers into a single real-time collaborative workspace.

CHAPTER 2: WHAT CUSTOMERS CAN DO IN DEALFLOW360
As a customer in DealFlow360, you have access to the dedicated Customer Portal with the following capabilities:
1. View & Track Quotations: Review official quotes sent by your sales rep with line-item pricing, tier discounts, taxes, and contract terms.
2. Self-Service Deal Negotiation: Counter-offer proposed unit prices or discount percentages and submit direct revision proposals back to your sales representative.
3. One-Click Quotation Confirmation: Electronically accept and confirm approved quotations, automatically converting them into official Sales Orders.
4. Real-time Order Tracking: Monitor fulfillment progress (Pending, Allocated, Shipped, Delivered) across warehouses with tracking IDs.
5. Invoices & Payment Management: Access generated invoices, view billing terms, and initiate payments or download payment receipts.
6. Subscriptions Management: Review recurring billing contracts, active licenses, seat counts, and upcoming renewal schedules.
7. AI Customer Support Assistant: Ask questions about products, quotations, delivery status, refund and return policies 24/7.

CHAPTER 3: CUSTOMER TIERS & DISCOUNT POLICIES
DealFlow360 features automated Tier-based pricing rules for enterprise customers:
- BRONZE Tier: 5% default catalog discount on standard hardware and software items.
- SILVER Tier: 10% default discount for accounts with annual volume > $50,000.
- GOLD Tier: 15% automatic discount for enterprise accounts with volume > $150,000.
- Custom/Negotiated Discounts: Requests exceeding tier limits automatically trigger multi-stage Sales Manager and Finance governance reviews.

CHAPTER 4: QUOTATION WORKFLOW & STATUSES
1. DRAFT: Quotation created and configured with line items.
2. PENDING_APPROVAL: Quotation discount exceeds tier rules; currently under managerial review.
3. APPROVED: Verified by governance and available for customer review.
4. NEGOTIATION: Active back-and-forth between customer and sales rep.
5. CUSTOMER_CONFIRMED: Customer accepts the quote; ready for conversion to Sales Order.
6. FULFILLMENT: Warehouse inventory allocated, packed, and dispatched.

CHAPTER 5: RETURNS, CANCELLATION & REFUND POLICIES
- Hardware returns are accepted within 30 days of delivery in original condition.
- Software & SaaS subscription cancellations can be requested anytime before the next billing cycle.
- Approved refunds are credited to the customer account within 3 to 5 business days.
`;

export async function seedDealflowKnowledge(): Promise<void> {
  try {
    logger.info('Seeding DealFlow360 Platform Knowledge Base into vector database...');
    const result = await knowledgeIngestionService.ingestDocument({
      documentId: 'dealflow360_platform_docs',
      filename: 'DealFlow360_Platform_and_Customer_Guide.pdf',
      fileContent: DEALFLOW360_KNOWLEDGE_TEXT,
      fileType: 'pdf',
      source: 'DealFlow360 Product Documentation',
      pageCount: 5,
    });
    logger.info({ chunkCount: result.length }, 'DealFlow360 Platform Guide seeded successfully.');
  } catch (error) {
    logger.warn({ err: error }, 'DealFlow360 Knowledge seeding fallback mode active.');
  }
}
