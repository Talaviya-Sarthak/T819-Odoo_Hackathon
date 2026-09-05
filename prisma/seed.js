const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Customer Tiers ─────────────────────────────────
  const bronze = await prisma.customerTier.upsert({
    where: { name: 'Bronze' },
    update: {},
    create: { name: 'Bronze', description: 'Entry-level tier', defaultDiscountPercent: 5 },
  });

  const silver = await prisma.customerTier.upsert({
    where: { name: 'Silver' },
    update: {},
    create: { name: 'Silver', description: 'Mid-level tier', defaultDiscountPercent: 10 },
  });

  const gold = await prisma.customerTier.upsert({
    where: { name: 'Gold' },
    update: {},
    create: { name: 'Gold', description: 'Premium tier', defaultDiscountPercent: 15 },
  });

  // ─── Categories ─────────────────────────────────────
  const software = await prisma.category.upsert({
    where: { name: 'Software' },
    update: {},
    create: { name: 'Software', description: 'Software licenses and subscriptions' },
  });

  const hardware = await prisma.category.upsert({
    where: { name: 'Hardware' },
    update: {},
    create: { name: 'Hardware', description: 'Physical hardware products' },
  });

  const services = await prisma.category.upsert({
    where: { name: 'Services' },
    update: {},
    create: { name: 'Services', description: 'Professional services' },
  });

  // ─── Products ───────────────────────────────────────
  const products = [
    {
      sku: 'SW-ENT-001',
      name: 'Enterprise License',
      description: 'Annual enterprise software license',
      categoryId: software.id,
      basePrice: 12000,
      costPrice: 3600,
      taxPercent: 10,
      productType: 'license',
    },
    {
      sku: 'SW-PRO-001',
      name: 'Professional License',
      description: 'Annual professional software license',
      categoryId: software.id,
      basePrice: 6000,
      costPrice: 1800,
      taxPercent: 10,
      productType: 'license',
    },
    {
      sku: 'SW-STD-001',
      name: 'Standard License',
      description: 'Annual standard software license',
      categoryId: software.id,
      basePrice: 2400,
      costPrice: 720,
      taxPercent: 10,
      productType: 'license',
    },
    {
      sku: 'HW-SRV-001',
      name: 'Dell PowerEdge Server',
      description: 'Rack-mounted enterprise server',
      categoryId: hardware.id,
      basePrice: 15000,
      costPrice: 9000,
      taxPercent: 8,
      productType: 'physical',
    },
    {
      sku: 'HW-UPS-001',
      name: 'UPS 3000VA',
      description: 'Uninterruptible Power Supply',
      categoryId: hardware.id,
      basePrice: 2200,
      costPrice: 1100,
      taxPercent: 8,
      productType: 'physical',
    },
    {
      sku: 'SV-IMP-001',
      name: 'Implementation Service',
      description: 'Full implementation and deployment',
      categoryId: services.id,
      basePrice: 25000,
      costPrice: 12500,
      taxPercent: 0,
      productType: 'service',
    },
    {
      sku: 'SV-TRN-001',
      name: 'Training Package',
      description: '3-day on-site training',
      categoryId: services.id,
      basePrice: 5000,
      costPrice: 2000,
      taxPercent: 0,
      productType: 'service',
      isSubscription: false,
    },
    {
      sku: 'SV-SUP-001',
      name: 'Premium Support',
      description: '24/7 priority support subscription',
      categoryId: services.id,
      basePrice: 1800,
      costPrice: 500,
      taxPercent: 0,
      productType: 'service',
      isSubscription: true,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // ─── Warehouses ─────────────────────────────────────
  await prisma.warehouse.upsert({
    where: { code: 'WH-NYC' },
    update: {},
    create: {
      name: 'New York Warehouse',
      code: 'WH-NYC',
      address: '123 Industrial Ave',
      city: 'New York',
      country: 'US',
      shippingCostWeight: 0.5,
    },
  });

  await prisma.warehouse.upsert({
    where: { code: 'WH-LAX' },
    update: {},
    create: {
      name: 'Los Angeles Warehouse',
      code: 'WH-LAX',
      address: '456 Logistics Blvd',
      city: 'Los Angeles',
      country: 'US',
      shippingCostWeight: 0.5,
    },
  });

  await prisma.warehouse.upsert({
    where: { code: 'WH-LON' },
    update: {},
    create: {
      name: 'London Warehouse',
      code: 'WH-LON',
      address: '78 Commerce Lane',
      city: 'London',
      country: 'UK',
      shippingCostWeight: 0.75,
    },
  });

  // ─── Approval Rules ─────────────────────────────────
  await prisma.approvalRule.createMany({
    data: [
      { name: 'High Value', minAmount: 50000, riskThreshold: 80, requiredLevel: 'SALES_MANAGER' },
      { name: 'Very High Value', minAmount: 100000, riskThreshold: 60, requiredLevel: 'ADMIN' },
      { name: 'High Discount', minAmount: 0, riskThreshold: 90, requiredLevel: 'SALES_MANAGER' },
    ],
    skipDuplicates: true,
  });

  // ─── Discount Rules ─────────────────────────────────
  await prisma.discountRule.createMany({
    data: [
      { name: 'Bronze Software Discount', customerTierId: bronze.id, categoryId: software.id, maxDiscountPercent: 10, approvalRequired: false },
      { name: 'Bronze Hardware Discount', customerTierId: bronze.id, categoryId: hardware.id, maxDiscountPercent: 5, approvalRequired: false },
      { name: 'Silver Software Discount', customerTierId: silver.id, categoryId: software.id, maxDiscountPercent: 15, approvalRequired: false },
      { name: 'Silver Hardware Discount', customerTierId: silver.id, categoryId: hardware.id, maxDiscountPercent: 10, approvalRequired: false },
      { name: 'Gold Software Discount', customerTierId: gold.id, categoryId: software.id, maxDiscountPercent: 25, approvalRequired: true, approvalLevel: 'SALES_MANAGER' },
      { name: 'Gold Hardware Discount', customerTierId: gold.id, categoryId: hardware.id, maxDiscountPercent: 15, approvalRequired: false },
    ],
    skipDuplicates: true,
  });

  // ─── Subscription Plans ─────────────────────────────
  await prisma.subscriptionPlan.createMany({
    data: [
      { name: 'Monthly Support', billingInterval: 'monthly', price: 150, currency: 'USD', cancellationPolicy: '30 day notice', refundPolicy: 'Pro-rata refund' },
      { name: 'Annual Support', billingInterval: 'yearly', price: 1500, currency: 'USD', prorationEnabled: true, cancellationPolicy: '60 day notice', refundPolicy: 'Pro-rata refund' },
    ],
    skipDuplicates: true,
  });

  // ─── Upsell Rules ───────────────────────────────────
  const entLicense = await prisma.product.findUnique({ where: { sku: 'SW-ENT-001' } });
  const implService = await prisma.product.findUnique({ where: { sku: 'SV-IMP-001' } });
  const premiumSupport = await prisma.product.findUnique({ where: { sku: 'SV-SUP-001' } });

  if (entLicense && implService) {
    await prisma.upsellRule.create({
      data: {
        sourceProductId: entLicense.id,
        recommendedProductId: implService.id,
        ruleType: 'UPSELL',
        priority: 1,
        minimumMarginPercent: 20,
        promotionText: 'Add implementation service for a smooth deployment',
        isActive: true,
      },
    });
  }

  if (entLicense && premiumSupport) {
    await prisma.upsellRule.create({
      data: {
        sourceProductId: entLicense.id,
        recommendedProductId: premiumSupport.id,
        ruleType: 'CROSS_SELL',
        priority: 2,
        minimumMarginPercent: 30,
        promotionText: 'Get 24/7 priority support with your license',
        isActive: true,
      },
    });
  }

  // ─── Demo Customers ─────────────────────────────────
  await prisma.customer.createMany({
    data: [
      { name: 'Acme Corp', companyName: 'Acme Corporation', email: 'info@acme.com', phone: '+1-555-0101', city: 'New York', country: 'US', tierId: gold.id, currency: 'USD' },
      { name: 'TechStart Inc', companyName: 'TechStart Inc', email: 'hello@techstart.io', phone: '+1-555-0202', city: 'San Francisco', country: 'US', tierId: silver.id, currency: 'USD' },
      { name: 'Global Mfg', companyName: 'Global Manufacturing Ltd', email: 'sales@globalmfg.com', phone: '+44-20-7946-0958', city: 'London', country: 'UK', tierId: bronze.id, currency: 'GBP' },
    ],
    skipDuplicates: true,
  });

  // ─── Demo Users ─────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Demo123!', 10);

  const demoUsers = [
    { email: 'admin@dealflow360.com', name: 'Admin User', role: 'ADMIN' },
    { email: 'sales@dealflow360.com', name: 'Sarah Sales', role: 'SALES_REP' },
    { email: 'manager@dealflow360.com', name: 'Mike Manager', role: 'SALES_MANAGER' },
    { email: 'finance@dealflow360.com', name: 'Fiona Finance', role: 'FINANCE' },
    { email: 'ops@dealflow360.com', name: 'Oscar Ops', role: 'OPERATIONS' },
    { email: 'customer@dealflow360.com', name: 'Customer User', role: 'CUSTOMER' },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        password: hashedPassword,
        emailVerified: true,
        status: 'active',
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
