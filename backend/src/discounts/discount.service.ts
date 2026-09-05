import prisma from '../common/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface LineDiscountCheck {
  productId: string;
  productName: string;
  requestedDiscount: number;
  allowedDiscount: number;
  excess: number;
  marginImpact: string;
  violation: boolean;
}

export interface DiscountCheckResult {
  allowed: boolean;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  violations: LineDiscountCheck[];
  requiredApprovalLevel: string | null;
}

export async function getDiscountRules() {
  return prisma.discountRule.findMany({
    where: { active: true },
    include: { customerTier: true, category: true },
  });
}

export async function checkDiscounts(quotationId: string): Promise<DiscountCheckResult> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: { include: { tier: true } },
      lines: { include: { product: { include: { category: true } } } },
    },
  });

  if (!quotation) throw new Error('Quotation not found');

  const rules = await prisma.discountRule.findMany({
    where: { active: true },
    include: { customerTier: true, category: true },
  });

  const violations: LineDiscountCheck[] = [];
  let totalRiskScore = 0;
  let violatingLineCount = 0;

  for (const line of quotation.lines) {
    const requestedDiscount = Number(line.discountPercent);
    let maxAllowed = 100;

    // Check tier-based rules
    const tierRules = rules.filter(
      r => r.type === 'TIER' && r.customerTierId === quotation.customer.tierId
    );
    if (tierRules.length > 0) {
      const tierMax = Math.max(...tierRules.map(r => Number(r.maxDiscountPct)));
      maxAllowed = Math.min(maxAllowed, tierMax);
    }

    // Check category-based rules
    if (line.product.categoryId) {
      const catRules = rules.filter(
        r => r.type === 'CATEGORY' && r.categoryId === line.product.categoryId
      );
      if (catRules.length > 0) {
        const catMax = Math.max(...catRules.map(r => Number(r.maxDiscountPct)));
        maxAllowed = Math.min(maxAllowed, catMax);
      }
    }

    const excess = Math.max(0, requestedDiscount - maxAllowed);
    const marginImpact = line.marginAmount.toString();

    const violation = excess > 0;
    if (violation) {
      violatingLineCount++;
    }

    const lineRiskScore = violation
      ? Math.min(100, excess * 5 + (Number(line.lineTotal) > 10000 ? 20 : 0) + (Number(line.marginPercentage) < 10 ? 15 : 0))
      : 0;
    totalRiskScore += lineRiskScore;

    violations.push({
      productId: line.productId,
      productName: line.product.name,
      requestedDiscount,
      allowedDiscount: maxAllowed,
      excess,
      marginImpact,
      violation,
    });
  }

  // Blended risk: aggregate across all lines
  const blendedRisk = calculateBlendedRisk(
    totalRiskScore,
    violations.length,
    violatingLineCount,
    Number(quotation.totalAmount)
  );

  // Determine required approval level
  const requiredApprovalLevel = determineApprovalLevel(blendedRisk.riskScore);

  return {
    allowed: blendedRisk.riskScore === 0,
    riskScore: blendedRisk.riskScore,
    riskLevel: blendedRisk.riskLevel,
    violations: violations.filter(v => v.violation),
    requiredApprovalLevel,
  };
}

function calculateBlendedRisk(
  totalLineRisk: number,
  totalLines: number,
  violatingLines: number,
  quotationValue: number
): { riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } {
  if (violatingLines === 0) {
    return { riskScore: 0, riskLevel: 'LOW' };
  }

  const avgLineRisk = totalLineRisk / violatingLines;
  const violationRatio = violatingLines / totalLines;

  // Weighted scoring
  let score = avgLineRisk * 0.4; // 40% weight on average line risk
  score += violationRatio * 30;   // 30% weight on violation ratio
  score += Math.min(30, (quotationValue / 1000) * 2); // 30% weight on value (capped)

  score = Math.min(100, Math.max(1, Math.round(score)));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (score < 25) riskLevel = 'LOW';
  else if (score < 50) riskLevel = 'MEDIUM';
  else if (score < 75) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';

  return { riskScore: score, riskLevel };
}

function determineApprovalLevel(riskScore: number): string | null {
  if (riskScore === 0) return null;
  if (riskScore < 25) return 'SALES_MANAGER';
  if (riskScore < 60) return 'SALES_MANAGER';
  if (riskScore < 80) return 'SALES_MANAGER,FINANCE';
  return 'SALES_MANAGER,FINANCE,ADMIN';
}
