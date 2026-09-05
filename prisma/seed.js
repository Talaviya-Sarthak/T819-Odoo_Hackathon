const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
} catch (e) {
  require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
}

let PrismaClient, Prisma, bcrypt;
try {
  ({ PrismaClient, Prisma } = require('@prisma/client'));
  bcrypt = require('bcryptjs');
} catch (e) {
  ({ PrismaClient, Prisma } = require(path.join(__dirname, '../backend/node_modules/@prisma/client')));
  bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for DealFlow360...');

  // ─── 1. Customer Tiers ───────────────────────────────────────
  console.log('Creating customer tiers...');
  const bronze = await prisma.customerTier.upsert({
    where: { name: 'BRONZE' },
    update: { discountPct: new Prisma.Decimal(5) },
    create: {
      name: 'BRONZE',
      description: 'Bronze tier customer (up to 5% discount)',
      discountPct: new Prisma.Decimal(5),
    },
  });

  const silver = await prisma.customerTier.upsert({
    where: { name: 'SILVER' },
    update: { discountPct: new Prisma.Decimal(10) },
    create: {
      name: 'SILVER',
      description: 'Silver tier customer (up to 10% discount)',
      discountPct: new Prisma.Decimal(10),
    },
  });

  const gold = await prisma.customerTier.upsert({
    where: { name: 'GOLD' },
    update: { discountPct: new Prisma.Decimal(15) },
    create: {
      name: 'GOLD',
      description: 'Gold tier customer (up to 15% discount)',
      discountPct: new Prisma.Decimal(15),
    },
  });

  // ─── 2. Categories ───────────────────────────────────────────
  console.log('Creating product categories...');
  const hardware = await prisma.category.upsert({
    where: { name: 'Hardware' },
    update: { active: true },
    create: { name: 'Hardware', description: 'Enterprise hardware, laptops, monitors, peripherals', active: true },
  });

  const services = await prisma.category.upsert({
    where: { name: 'Services' },
    update: { active: true },
    create: { name: 'Services', description: 'Professional consulting, installation, and deployment services', active: true },
  });

  const software = await prisma.category.upsert({
    where: { name: 'Software' },
    update: { active: true },
    create: { name: 'Software', description: 'Software licenses, security, and cloud backup subscriptions', active: true },
  });

  const accessories = await prisma.category.upsert({
    where: { name: 'Accessories' },
    update: { active: true },
    create: { name: 'Accessories', description: 'Office ergonomics, bags, cables, and input devices', active: true },
  });

  // ─── 3. Products (10 items) ───────────────────────────────────
  console.log('Creating products...');
  const productList = [
    {
      sku: 'HW-LAPTOP-001',
      name: 'Laptop',
      description: 'Dell Latitude 15" Core i7 32GB RAM 512GB SSD Enterprise Laptop',
      unit: 'unit',
      basePrice: new Prisma.Decimal('1200.00'),
      costPrice: new Prisma.Decimal('800.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: hardware.id,
      active: true,
    },
    {
      sku: 'HW-MONITOR-001',
      name: 'Monitor',
      description: '27" 4K IPS Ultra-Slim Business Display',
      unit: 'unit',
      basePrice: new Prisma.Decimal('450.00'),
      costPrice: new Prisma.Decimal('280.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: hardware.id,
      active: true,
    },
    {
      sku: 'AC-KEYBOARD-001',
      name: 'Keyboard',
      description: 'Wireless Ergonomic Mechanical Keyboard',
      unit: 'unit',
      basePrice: new Prisma.Decimal('80.00'),
      costPrice: new Prisma.Decimal('35.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: accessories.id,
      active: true,
    },
    {
      sku: 'AC-MOUSE-001',
      name: 'Mouse',
      description: 'Precision Ergonomic Wireless Laser Mouse',
      unit: 'unit',
      basePrice: new Prisma.Decimal('45.00'),
      costPrice: new Prisma.Decimal('18.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: accessories.id,
      active: true,
    },
    {
      sku: 'HW-DOCK-001',
      name: 'Docking Station',
      description: 'Universal Thunderbolt 4 Quad-Display Enterprise Dock',
      unit: 'unit',
      basePrice: new Prisma.Decimal('180.00'),
      costPrice: new Prisma.Decimal('95.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: hardware.id,
      active: true,
    },
    {
      sku: 'SV-SETUP-001',
      name: 'Office Setup Service',
      description: 'Complete on-site deployment, workstation calibration, and network setup',
      unit: 'service',
      basePrice: new Prisma.Decimal('500.00'),
      costPrice: new Prisma.Decimal('250.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: services.id,
      active: true,
    },
    {
      sku: 'SW-BACKUP-001',
      name: 'Cloud Backup',
      description: 'Automated 1TB Encrypted Cloud Backup & Disaster Recovery',
      unit: 'license',
      basePrice: new Prisma.Decimal('120.00'),
      costPrice: new Prisma.Decimal('30.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: software.id,
      active: true,
    },
    {
      sku: 'SV-SUPPORT-001',
      name: 'Premium Support',
      description: '24/7 dedicated enterprise technical support SLA with 1-hr response',
      unit: 'contract',
      basePrice: new Prisma.Decimal('1500.00'),
      costPrice: new Prisma.Decimal('400.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: services.id,
      active: true,
    },
    {
      sku: 'SW-SEC-001',
      name: 'Security Add-on',
      description: 'Zero-Trust Endpoint Detection & Response (EDR) Suite',
      unit: 'license',
      basePrice: new Prisma.Decimal('250.00'),
      costPrice: new Prisma.Decimal('60.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: software.id,
      active: true,
    },
    {
      sku: 'AC-BAG-001',
      name: 'Laptop Bag',
      description: 'Ballistic Nylon Weatherproof Executive Briefcase & Backpack',
      unit: 'unit',
      basePrice: new Prisma.Decimal('65.00'),
      costPrice: new Prisma.Decimal('25.00'),
      taxRate: new Prisma.Decimal('18.00'),
      categoryId: accessories.id,
      active: true,
    },
  ];

  for (const p of productList) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
  }

  // ─── 4. Demo Users for all Required Roles ─────────────────────
  console.log('Creating demo users...');
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const demoUsers = [
    { email: 'admin@dealflow360.com', name: 'Admin User', role: 'ADMIN' },
    { email: 'sales@dealflow360.com', name: 'Sarah Sales Rep', role: 'SALES_REP' },
    { email: 'manager@dealflow360.com', name: 'Mike Sales Manager', role: 'SALES_MANAGER' },
    { email: 'finance@dealflow360.com', name: 'Fiona Finance', role: 'FINANCE' },
    { email: 'ops@dealflow360.com', name: 'Oscar Operations', role: 'OPERATIONS' },
    { email: 'customer@dealflow360.com', name: 'Carl Customer', role: 'CUSTOMER' },
    // Also support demo domains used in earlier auth tests
    { email: 'sales@dealflow.demo', name: 'Sales Rep Demo', role: 'SALES_REP' },
    { email: 'manager@dealflow.demo', name: 'Manager Demo', role: 'SALES_MANAGER' },
    { email: 'finance@dealflow.demo', name: 'Finance Demo', role: 'FINANCE' },
    { email: 'ops@dealflow.demo', name: 'Ops Demo', role: 'OPERATIONS' },
    { email: 'customer@dealflow.demo', name: 'Customer Demo', role: 'CUSTOMER' },
  ];

  const userMap = {};
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role,
        passwordHash,
        emailVerified: true,
        status: 'active',
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        emailVerified: true,
        status: 'active',
      },
    });
    userMap[u.role] = user;
  }

  const salesRepUser = userMap['SALES_REP'];

  // ─── 5. Customers (5 items) ───────────────────────────────────
  console.log('Creating demo customers...');
  const customerList = [
    {
      name: 'Acme Corp',
      company: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1-555-0100',
      address: '100 Industrial Parkway, Austin, TX',
      tierId: gold.id,
      salesRepId: salesRepUser.id,
      currency: 'USD',
    },
    {
      name: 'TechCorp',
      company: 'TechCorp Inc',
      email: 'info@techcorp.com',
      phone: '+1-555-0200',
      address: '500 Silicon Way, San Jose, CA',
      tierId: silver.id,
      salesRepId: salesRepUser.id,
      currency: 'USD',
    },
    {
      name: 'GlobalSoft',
      company: 'GlobalSoft Ltd',
      email: 'hello@globalsoft.com',
      phone: '+44-20-7946-0958',
      address: '25 Finsbury Square, London, UK',
      tierId: bronze.id,
      salesRepId: salesRepUser.id,
      currency: 'USD',
    },
    {
      name: 'StartupXYZ',
      company: 'StartupXYZ Technologies',
      email: 'team@startupxyz.com',
      phone: '+1-555-0300',
      address: '42 Innovation Hub, Boulder, CO',
      tierId: bronze.id,
      salesRepId: salesRepUser.id,
      currency: 'USD',
    },
    {
      name: 'Enterprise Ltd',
      company: 'Enterprise Solutions Ltd',
      email: 'sales@enterprise.com',
      phone: '+1-555-0400',
      address: '77 Wall Street, New York, NY',
      tierId: gold.id,
      salesRepId: salesRepUser.id,
      currency: 'USD',
    },
  ];

  for (const c of customerList) {
    const existing = await prisma.customer.findFirst({ where: { name: c.name } });
    if (existing) {
      await prisma.customer.update({ where: { id: existing.id }, data: c });
    } else {
      await prisma.customer.create({ data: c });
    }
  }

  // Link customer demo users to Acme Corp customer record
  const acme = await prisma.customer.findFirst({ where: { name: 'Acme Corp' } });
  if (acme) {
    await prisma.user.updateMany({
      where: { role: 'CUSTOMER' },
      data: { customerId: acme.id },
    });
  }

  // ─── 6. Warehouses ───────────────────────────────────────────
  console.log('Creating warehouses...');
  await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { name: 'Ahmedabad Warehouse', location: 'Ahmedabad, Gujarat, India', active: true },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Ahmedabad Warehouse',
      location: 'Ahmedabad, Gujarat, India',
      active: true,
    },
  });

  await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: { name: 'Vadodara Warehouse', location: 'Vadodara, Gujarat, India', active: true },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Vadodara Warehouse',
      location: 'Vadodara, Gujarat, India',
      active: true,
    },
  });

  // ─── 7. Subscription Plans ───────────────────────────────────
  console.log('Creating subscription plans...');
  const plans = [
    { id: '10000000-0000-0000-0000-000000000001', name: 'Monthly Support Plan', interval: 'monthly', price: new Prisma.Decimal('150.00'), description: 'Monthly rolling SLA support contract' },
    { id: '10000000-0000-0000-0000-000000000002', name: 'Quarterly Support Plan', interval: 'quarterly', price: new Prisma.Decimal('420.00'), description: 'Quarterly discounted SLA support contract' },
    { id: '10000000-0000-0000-0000-000000000003', name: 'Yearly Support Plan', interval: 'yearly', price: new Prisma.Decimal('1500.00'), description: 'Annual enterprise support contract with highest priority SLA' },
  ];

  for (const pl of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: pl.id },
      update: pl,
      create: pl,
    });
  }

  // ─── 8. Discount Rules (Database-Driven) ──────────────────────
  console.log('Configuring discount governance rules...');
  await prisma.discountRule.deleteMany({});

  // Tier rules
  await prisma.discountRule.createMany({
    data: [
      {
        name: 'Bronze Tier Max Discount',
        type: 'TIER',
        customerTierId: bronze.id,
        maxDiscountPct: new Prisma.Decimal('5.00'),
        active: true,
      },
      {
        name: 'Silver Tier Max Discount',
        type: 'TIER',
        customerTierId: silver.id,
        maxDiscountPct: new Prisma.Decimal('10.00'),
        active: true,
      },
      {
        name: 'Gold Tier Max Discount',
        type: 'TIER',
        customerTierId: gold.id,
        maxDiscountPct: new Prisma.Decimal('15.00'),
        active: true,
      },
      // Category rules
      {
        name: 'Hardware Max Discount',
        type: 'CATEGORY',
        categoryId: hardware.id,
        maxDiscountPct: new Prisma.Decimal('15.00'),
        active: true,
      },
      {
        name: 'Services Max Discount',
        type: 'CATEGORY',
        categoryId: services.id,
        maxDiscountPct: new Prisma.Decimal('10.00'),
        active: true,
      },
      {
        name: 'Software Max Discount',
        type: 'CATEGORY',
        categoryId: software.id,
        maxDiscountPct: new Prisma.Decimal('12.00'),
        active: true,
      },
      {
        name: 'Accessories Max Discount',
        type: 'CATEGORY',
        categoryId: accessories.id,
        maxDiscountPct: new Prisma.Decimal('8.00'),
        active: true,
      },
    ],
  });

  // ─── 9. Approval Rules ───────────────────────────────────────
  console.log('Configuring approval rules...');
  await prisma.approvalRule.deleteMany({});
  await prisma.approvalRule.createMany({
    data: [
      { name: 'Low Risk Approval', minRiskScore: 1, maxRiskScore: 24, requiredRole: 'SALES_MANAGER', stepOrder: 1, active: true },
      { name: 'Medium Risk Approval', minRiskScore: 25, maxRiskScore: 59, requiredRole: 'SALES_MANAGER', stepOrder: 1, active: true },
      { name: 'High Risk Step 1 (Sales Manager)', minRiskScore: 60, maxRiskScore: 79, requiredRole: 'SALES_MANAGER', stepOrder: 1, active: true },
      { name: 'High Risk Step 2 (Finance)', minRiskScore: 60, maxRiskScore: 79, requiredRole: 'FINANCE', stepOrder: 2, active: true },
      { name: 'Critical Risk Step 1 (Sales Manager)', minRiskScore: 80, maxRiskScore: 100, requiredRole: 'SALES_MANAGER', stepOrder: 1, active: true },
      { name: 'Critical Risk Step 2 (Finance)', minRiskScore: 80, maxRiskScore: 100, requiredRole: 'FINANCE', stepOrder: 2, active: true },
      { name: 'Critical Risk Step 3 (Admin)', minRiskScore: 80, maxRiskScore: 100, requiredRole: 'ADMIN', stepOrder: 3, active: true },
    ],
  });

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDemo User Accounts (Password: demo1234):');
  console.log('  ADMIN:         admin@dealflow360.com');
  console.log('  SALES_REP:     sales@dealflow360.com');
  console.log('  SALES_MANAGER: manager@dealflow360.com');
  console.log('  FINANCE:       finance@dealflow360.com');
  console.log('  OPERATIONS:    ops@dealflow360.com');
  console.log('  CUSTOMER:      customer@dealflow360.com');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
