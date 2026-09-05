import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // ─── CUSTOMER TIERS ──────────────────────────────────────────────────────
  console.log('Creating customer tiers...');
  const bronze = await prisma.customerTier.upsert({
    where: { name: 'BRONZE' },
    update: {},
    create: { name: 'BRONZE', description: 'Basic tier', discountPct: 5 },
  });
  const silver = await prisma.customerTier.upsert({
    where: { name: 'SILVER' },
    update: {},
    create: { name: 'SILVER', description: 'Mid tier', discountPct: 10 },
  });
  const gold = await prisma.customerTier.upsert({
    where: { name: 'GOLD' },
    update: {},
    create: { name: 'GOLD', description: 'Premium tier', discountPct: 15 },
  });
  console.log('  Tiers: BRONZE, SILVER, GOLD');

  // ─── USERS ────────────────────────────────────────────────────────────────
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dealflow.com' },
    update: {},
    create: {
      email: 'admin@dealflow.com', name: 'Admin User',
      passwordHash, role: UserRole.ADMIN, emailVerified: true, status: 'active',
    },
  });

  const salesRep = await prisma.user.upsert({
    where: { email: 'rep@dealflow.com' },
    update: {},
    create: {
      email: 'rep@dealflow.com', name: 'Sales Rep',
      passwordHash, role: UserRole.SALES_REP, emailVerified: true, status: 'active',
    },
  });

  const salesManager = await prisma.user.upsert({
    where: { email: 'manager@dealflow.com' },
    update: {},
    create: {
      email: 'manager@dealflow.com', name: 'Sales Manager',
      passwordHash, role: UserRole.SALES_MANAGER, emailVerified: true, status: 'active',
    },
  });

  const finance = await prisma.user.upsert({
    where: { email: 'finance@dealflow.com' },
    update: {},
    create: {
      email: 'finance@dealflow.com', name: 'Finance Officer',
      passwordHash, role: UserRole.FINANCE, emailVerified: true, status: 'active',
    },
  });

  const operations = await prisma.user.upsert({
    where: { email: 'ops@dealflow.com' },
    update: {},
    create: {
      email: 'ops@dealflow.com', name: 'Operations Manager',
      passwordHash, role: UserRole.OPERATIONS, emailVerified: true, status: 'active',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@dealflow.com' },
    update: {},
    create: {
      email: 'customer@dealflow.com', name: 'Customer Portal User',
      passwordHash, role: UserRole.CUSTOMER, emailVerified: true, status: 'active',
    },
  });
  console.log('  Users: admin, rep, manager, finance, ops, customer');

  // ─── CATEGORIES ──────────────────────────────────────────────────────────
  console.log('Creating categories...');
  const hardware = await prisma.category.upsert({
    where: { name: 'Hardware' }, update: {},
    create: { name: 'Hardware', description: 'Physical hardware products' },
  });
  const services = await prisma.category.upsert({
    where: { name: 'Services' }, update: {},
    create: { name: 'Services', description: 'Professional services' },
  });
  const software = await prisma.category.upsert({
    where: { name: 'Software' }, update: {},
    create: { name: 'Software', description: 'Software licenses' },
  });
  const accessories = await prisma.category.upsert({
    where: { name: 'Accessories' }, update: {},
    create: { name: 'Accessories', description: 'Computer accessories' },
  });
  console.log('  Categories: Hardware, Services, Software, Accessories');

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  console.log('Creating products...');
  const laptop = await prisma.product.upsert({
    where: { sku: 'HW-LAPTOP-001' }, update: {},
    create: {
      name: 'Laptop', sku: 'HW-LAPTOP-001', description: 'Business Laptop',
      unit: 'unit', basePrice: 1200, costPrice: 800, taxRate: 18,
      categoryId: hardware.id, active: true,
    },
  });
  const monitor = await prisma.product.upsert({
    where: { sku: 'HW-MONITOR-001' }, update: {},
    create: {
      name: 'Monitor', sku: 'HW-MONITOR-001', description: '27" 4K Monitor',
      unit: 'unit', basePrice: 450, costPrice: 280, taxRate: 18,
      categoryId: hardware.id, active: true,
    },
  });
  const keyboard = await prisma.product.upsert({
    where: { sku: 'AC-KEYBOARD-001' }, update: {},
    create: {
      name: 'Keyboard', sku: 'AC-KEYBOARD-001', description: 'Mechanical Keyboard',
      unit: 'unit', basePrice: 80, costPrice: 35, taxRate: 18,
      categoryId: accessories.id, active: true,
    },
  });
  const mouse = await prisma.product.upsert({
    where: { sku: 'AC-MOUSE-001' }, update: {},
    create: {
      name: 'Mouse', sku: 'AC-MOUSE-001', description: 'Wireless Mouse',
      unit: 'unit', basePrice: 45, costPrice: 18, taxRate: 18,
      categoryId: accessories.id, active: true,
    },
  });
  const dockingStation = await prisma.product.upsert({
    where: { sku: 'HW-DOCK-001' }, update: {},
    create: {
      name: 'Docking Station', sku: 'HW-DOCK-001', description: 'USB-C Docking Station',
      unit: 'unit', basePrice: 180, costPrice: 95, taxRate: 18,
      categoryId: hardware.id, active: true,
    },
  });
  const officeSetupService = await prisma.product.upsert({
    where: { sku: 'SV-SETUP-001' }, update: {},
    create: {
      name: 'Office Setup Service', sku: 'SV-SETUP-001', description: 'Professional office setup',
      unit: 'service', basePrice: 500, costPrice: 200, taxRate: 18,
      categoryId: services.id, active: true,
    },
  });
  const cloudBackup = await prisma.product.upsert({
    where: { sku: 'SW-BACKUP-001' }, update: {},
    create: {
      name: 'Cloud Backup', sku: 'SW-BACKUP-001', description: 'Cloud backup solution',
      unit: 'license', basePrice: 30, costPrice: 5, taxRate: 18,
      categoryId: software.id, active: true,
    },
  });
  const premiumSupport = await prisma.product.upsert({
    where: { sku: 'SV-SUPPORT-001' }, update: {},
    create: {
      name: 'Premium Support', sku: 'SV-SUPPORT-001', description: '24/7 premium support',
      unit: 'license', basePrice: 100, costPrice: 30, taxRate: 18,
      categoryId: services.id, active: true,
    },
  });
  const securityAddon = await prisma.product.upsert({
    where: { sku: 'SW-SEC-001' }, update: {},
    create: {
      name: 'Security Add-on', sku: 'SW-SEC-001', description: 'Advanced security suite',
      unit: 'license', basePrice: 50, costPrice: 12, taxRate: 18,
      categoryId: software.id, active: true,
    },
  });
  const laptopBag = await prisma.product.upsert({
    where: { sku: 'AC-BAG-001' }, update: {},
    create: {
      name: 'Laptop Bag', sku: 'AC-BAG-001', description: 'Premium laptop bag',
      unit: 'unit', basePrice: 35, costPrice: 12, taxRate: 18,
      categoryId: accessories.id, active: true,
    },
  });
  console.log('  Products: 10 created');

  // ─── CUSTOMERS ────────────────────────────────────────────────────────────
  console.log('Creating customers...');
  const acme = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Acme Corp', company: 'Acme Corporation',
      email: 'contact@acme.com', phone: '+1-555-0101',
      address: '123 Main St, New York, NY 10001',
      currency: 'USD', tierId: gold.id, salesRepId: salesRep.id,
    },
  });
  const techcorp = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'TechCorp', company: 'TechCorp Inc',
      email: 'info@techcorp.com', phone: '+1-555-0102',
      address: '456 Tech Ave, San Francisco, CA 94102',
      currency: 'USD', tierId: silver.id, salesRepId: salesRep.id,
    },
  });
  const globalsoft = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'GlobalSoft', company: 'GlobalSoft Ltd',
      email: 'hello@globalsoft.com', phone: '+1-555-0103',
      address: '789 Global Blvd, Austin, TX 73301',
      currency: 'USD', tierId: bronze.id, salesRepId: salesRep.id,
    },
  });
  const startupxyz = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'StartupXYZ', company: 'StartupXYZ',
      email: 'team@startupxyz.com', phone: '+1-555-0104',
      address: '321 Startup Lane, Seattle, WA 98101',
      currency: 'USD', tierId: bronze.id, salesRepId: salesRep.id,
    },
  });
  const enterpriseLtd = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Enterprise Ltd', company: 'Enterprise Ltd',
      email: 'sales@enterprise.com', phone: '+1-555-0105',
      address: '555 Enterprise Way, Chicago, IL 60601',
      currency: 'USD', tierId: gold.id, salesRepId: salesRep.id,
    },
  });
  console.log('  Customers: Acme, TechCorp, GlobalSoft, StartupXYZ, Enterprise Ltd');

  // ─── WAREHOUSES ──────────────────────────────────────────────────────────
  console.log('Creating warehouses...');
  const ahmedabadWh = await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Ahmedabad Warehouse', location: 'Ahmedabad, Gujarat, India',
    },
  });
  const vadodaraWh = await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'Vadodara Warehouse', location: 'Vadodara, Gujarat, India',
    },
  });
  console.log('  Warehouses: Ahmedabad, Vadodara');

  // ─── SUBSCRIPTION PLANS ──────────────────────────────────────────────────
  console.log('Creating subscription plans...');
  await prisma.subscriptionPlan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      name: 'Monthly Plan', description: 'Month-to-month billing',
      interval: 'MONTHLY', price: 100, active: true,
    },
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000021' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000021',
      name: 'Quarterly Plan', description: 'Quarterly billing, 5% discount',
      interval: 'QUARTERLY', price: 285, active: true,
    },
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000022' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000022',
      name: 'Yearly Plan', description: 'Annual billing, 15% discount',
      interval: 'YEARLY', price: 1020, active: true,
    },
  });
  console.log('  Subscription Plans: Monthly, Quarterly, Yearly');

  // ─── DISCOUNT RULES ──────────────────────────────────────────────────────
  console.log('Creating discount rules...');

  // Tier-based rules
  await prisma.discountRule.create({
    data: {
      name: 'Bronze Tier Max Discount', type: 'TIER',
      customerTierId: bronze.id, maxDiscountPct: 5, active: true,
    },
  });
  await prisma.discountRule.create({
    data: {
      name: 'Silver Tier Max Discount', type: 'TIER',
      customerTierId: silver.id, maxDiscountPct: 10, active: true,
    },
  });
  await prisma.discountRule.create({
    data: {
      name: 'Gold Tier Max Discount', type: 'TIER',
      customerTierId: gold.id, maxDiscountPct: 15, active: true,
    },
  });

  // Category-based rules
  await prisma.discountRule.create({
    data: {
      name: 'Hardware Max Discount', type: 'CATEGORY',
      categoryId: hardware.id, maxDiscountPct: 15, active: true,
    },
  });
  await prisma.discountRule.create({
    data: {
      name: 'Services Max Discount', type: 'CATEGORY',
      categoryId: services.id, maxDiscountPct: 10, active: true,
    },
  });
  await prisma.discountRule.create({
    data: {
      name: 'Software Max Discount', type: 'CATEGORY',
      categoryId: software.id, maxDiscountPct: 12, active: true,
    },
  });
  await prisma.discountRule.create({
    data: {
      name: 'Accessories Max Discount', type: 'CATEGORY',
      categoryId: accessories.id, maxDiscountPct: 8, active: true,
    },
  });
  console.log('  Discount Rules: 7 rules (3 tier + 4 category)');

  // ─── APPROVAL RULES ──────────────────────────────────────────────────────
  console.log('Creating approval rules...');
  await prisma.approvalRule.create({
    data: {
      name: 'Low Risk - Manager', minRiskScore: 1, maxRiskScore: 24,
      requiredRole: UserRole.SALES_MANAGER, stepOrder: 1, active: true,
    },
  });
  await prisma.approvalRule.create({
    data: {
      name: 'Medium Risk - Manager', minRiskScore: 25, maxRiskScore: 59,
      requiredRole: UserRole.SALES_MANAGER, stepOrder: 1, active: true,
    },
  });
  await prisma.approvalRule.create({
    data: {
      name: 'High Risk - Manager Step 1', minRiskScore: 60, maxRiskScore: 79,
      requiredRole: UserRole.SALES_MANAGER, stepOrder: 1, active: true,
    },
  });
  await prisma.approvalRule.create({
    data: {
      name: 'High Risk - Finance Step 2', minRiskScore: 60, maxRiskScore: 79,
      requiredRole: UserRole.FINANCE, stepOrder: 2, active: true,
    },
  });
  await prisma.approvalRule.create({
    data: {
      name: 'Critical Risk - Manager Step 1', minRiskScore: 80, maxRiskScore: 100,
      requiredRole: UserRole.SALES_MANAGER, stepOrder: 1, active: true,
    },
  });
  await prisma.approvalRule.create({
    data: {
      name: 'Critical Risk - Finance Step 2', minRiskScore: 80, maxRiskScore: 100,
      requiredRole: UserRole.FINANCE, stepOrder: 2, active: true,
    },
  });
  await prisma.approvalRule.create({
    data: {
      name: 'Critical Risk - Admin Step 3', minRiskScore: 80, maxRiskScore: 100,
      requiredRole: UserRole.ADMIN, stepOrder: 3, active: true,
    },
  });
  console.log('  Approval Rules: 7 rules for multi-step approval');

  // ─── PRICE LISTS ─────────────────────────────────────────────────────────
  console.log('Creating price lists...');
  const goldPriceList = await prisma.priceList.create({
    data: {
      name: 'Gold Tier Price List', currency: 'USD',
      customerTierId: gold.id, active: true,
    },
  });
  const silverPriceList = await prisma.priceList.create({
    data: {
      name: 'Silver Tier Price List', currency: 'USD',
      customerTierId: silver.id, active: true,
    },
  });

  // Gold tier prices
  const goldPrices = [
    { productId: laptop.id, price: 1100 },
    { productId: monitor.id, price: 400 },
    { productId: keyboard.id, price: 72 },
    { productId: mouse.id, price: 40 },
    { productId: dockingStation.id, price: 165 },
    { productId: officeSetupService.id, price: 450 },
    { productId: cloudBackup.id, price: 27 },
    { productId: premiumSupport.id, price: 90 },
    { productId: securityAddon.id, price: 45 },
    { productId: laptopBag.id, price: 30 },
  ];
  for (const p of goldPrices) {
    await prisma.priceListItem.create({
      data: { priceListId: goldPriceList.id, productId: p.productId, price: p.price },
    });
  }

  // Silver tier prices
  const silverPrices = [
    { productId: laptop.id, price: 1150 },
    { productId: monitor.id, price: 425 },
    { productId: keyboard.id, price: 76 },
    { productId: mouse.id, price: 42 },
    { productId: dockingStation.id, price: 172 },
    { productId: officeSetupService.id, price: 475 },
    { productId: cloudBackup.id, price: 28 },
    { productId: premiumSupport.id, price: 95 },
    { productId: securityAddon.id, price: 47 },
    { productId: laptopBag.id, price: 32 },
  ];
  for (const p of silverPrices) {
    await prisma.priceListItem.create({
      data: { priceListId: silverPriceList.id, productId: p.productId, price: p.price },
    });
  }
  console.log('  Price Lists: Gold, Silver tiers with items');

  // ─── WAREHOUSE STOCKS ────────────────────────────────────────────────────
  console.log('Creating warehouse stocks...');
  const products = [laptop, monitor, keyboard, mouse, dockingStation, laptopBag];
  for (const product of products) {
    await prisma.warehouseStock.create({
      data: { warehouseId: ahmedabadWh.id, productId: product.id, quantity: 100, reservedQty: 0 },
    });
    await prisma.warehouseStock.create({
      data: { warehouseId: vadodaraWh.id, productId: product.id, quantity: 50, reservedQty: 0 },
    });
  }
  console.log('  Warehouse Stocks: created for all physical products');

  // ─── DEMO QUOTATION (for testing discount flow) ──────────────────────────
  console.log('Creating demo quotation for discount flow test...');
  const demoQuotation = await prisma.quotation.create({
    data: {
      quotationNumber: 'Q-1001',
      customerId: acme.id,
      salesRepId: salesRep.id,
      status: 'DRAFT',
      currency: 'USD',
      notes: 'Demo quotation for Gold customer - Acme Corp',
    },
  });

  // Add lines: Laptop x 10 (12% discount) + Office Setup Service x 1 (18% discount)
  const laptopLine = await prisma.quotationLine.create({
    data: {
      quotationId: demoQuotation.id,
      productId: laptop.id,
      quantity: 10,
      unitPrice: 1100,
      unitCost: 800,
      discountPercent: 12,
      discountAmount: 1320,
      taxRate: 18,
      lineSubtotal: 11000,
      lineTotal: 11702.4,
      marginAmount: 3702.4,
      billingType: 'ONE_TIME',
    },
  });

  const serviceLine = await prisma.quotationLine.create({
    data: {
      quotationId: demoQuotation.id,
      productId: officeSetupService.id,
      quantity: 1,
      unitPrice: 450,
      unitCost: 200,
      discountPercent: 18,
      discountAmount: 81,
      taxRate: 18,
      lineSubtotal: 450,
      lineTotal: 441.54,
      marginAmount: 241.54,
      billingType: 'ONE_TIME',
    },
  });

  // Update quotation totals
  await prisma.quotation.update({
    where: { id: demoQuotation.id },
    data: {
      subtotal: 11450,
      discountAmount: 1401,
      taxAmount: 1792.94,
      totalAmount: 12143.94,
      totalCost: 8200,
      grossMargin: 3943.94,
      marginPercentage: 32.47,
    },
  });
  console.log('  Demo Quotation: Q-1001 (DRAFT) with Laptop x10 + Setup x1');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDemo Credentials:');
  console.log('  ADMIN:          admin@dealflow.com / demo1234');
  console.log('  SALES_REP:      rep@dealflow.com / demo1234');
  console.log('  SALES_MANAGER:  manager@dealflow.com / demo1234');
  console.log('  FINANCE:        finance@dealflow.com / demo1234');
  console.log('  OPERATIONS:     ops@dealflow.com / demo1234');
  console.log('  CUSTOMER:       customer@dealflow.com / demo1234');
  console.log('\nDiscount Rules:');
  console.log('  GOLD tier: 15% max');
  console.log('  SILVER tier: 10% max');
  console.log('  BRONZE tier: 5% max');
  console.log('  Hardware category: 15% max');
  console.log('  Services category: 10% max');
  console.log('  Software category: 12% max');
  console.log('  Accessories category: 8% max');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
