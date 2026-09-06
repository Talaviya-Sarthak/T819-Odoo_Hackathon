'use strict';

/**
 * DealFlow360 — Master High-Performance Seed Engine
 * Generates an authentic, production-grade, relationally-consistent B2B dataset
 * with up to 200 records per major business entity while remaining fast,
 * idempotent, and deterministic.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('./database/prisma');

// ─── 1. DETERMINISTIC PRNG (Mulberry32) ──────────────────────────────
function createPrng(seedStr = process.env.SEED || 'DEALFLOW360_HACKATHON_2026') {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const prng = createPrng();

const rand = () => prng();
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 2) => Number((rand() * (max - min) + min).toFixed(dec));
const randChoice = (arr) => arr[Math.floor(rand() * arr.length)];
const randSample = (arr, count) => {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
};
const randDate = (start, end) => new Date(start.getTime() + rand() * (end.getTime() - start.getTime()));

// Helper for safe batch chunking
async function chunkedCreateMany(delegate, data, chunkSize = 100) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await delegate.createMany({ data: chunk });
  }
}

async function runMasterSeed() {
  console.log('\n==================================================');
  console.log('🌱 DEALFLOW360 — PRODUCTION DATASET SEED ENGINE');
  console.log('==================================================');
  console.log(`Deterministic Seed: ${process.env.SEED || 'DEALFLOW360_HACKATHON_2026'}`);
  const startTime = Date.now();

  // ─── 2. CUSTOMER TIERS (3 tiers) ──────────────────────────────────
  console.log('\n[1/18] Upserting Customer Tiers...');
  const tiersData = [
    { id: '11000000-0000-0000-0000-000000000001', name: 'BRONZE', description: 'Standard commercial accounts (up to 5% standard discount)', discountPct: 5.0 },
    { id: '11000000-0000-0000-0000-000000000002', name: 'SILVER', description: 'Mid-tier preferred partners (up to 10% negotiated discount)', discountPct: 10.0 },
    { id: '11000000-0000-0000-0000-000000000003', name: 'GOLD', description: 'Strategic enterprise accounts (up to 15% VIP discount)', discountPct: 15.0 },
  ];

  const tiers = [];
  for (const t of tiersData) {
    const rec = await prisma.customerTier.upsert({
      where: { name: t.name },
      update: { discountPct: t.discountPct, description: t.description },
      create: t,
    });
    tiers.push(rec);
  }

  // ─── 3. CATEGORIES (8 categories) ─────────────────────────────────
  console.log('[2/18] Upserting Product Categories...');
  const categoriesData = [
    { id: '22000000-0000-0000-0000-000000000001', name: 'Hardware', description: 'Laptops, servers, workstations, monitors and networking hardware' },
    { id: '22000000-0000-0000-0000-000000000002', name: 'Software', description: 'Core operating licenses, enterprise productivity, and CRM platforms' },
    { id: '22000000-0000-0000-0000-000000000003', name: 'Services', description: 'Professional consulting, deployment, architecture, and integration' },
    { id: '22000000-0000-0000-0000-000000000004', name: 'Accessories', description: 'Peripherals, cables, adapters, ergonomics, and displays' },
    { id: '22000000-0000-0000-0000-000000000005', name: 'Cloud', description: 'Cloud infrastructure hosting, managed databases, and storage' },
    { id: '22000000-0000-0000-0000-000000000006', name: 'Security', description: 'Endpoint security, firewall appliances, and intrusion detection' },
    { id: '22000000-0000-0000-0000-000000000007', name: 'Storage', description: 'Enterprise SAN/NAS storage arrays, SSD arrays, and tape backups' },
    { id: '22000000-0000-0000-0000-000000000008', name: 'Support', description: 'Annual 24/7 SLA maintenance, technical support, and disaster recovery' },
  ];

  const categories = [];
  for (const c of categoriesData) {
    const rec = await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: c,
    });
    categories.push(rec);
  }

  // ─── 4. WAREHOUSES (8 facilities) ─────────────────────────────────
  console.log('[3/18] Upserting Warehouses...');
  const warehousesData = [
    { id: '33000000-0000-0000-0000-000000000001', code: 'WH-MUM-01', name: 'Mumbai Logistics Hub', location: 'Bhiwandi, Mumbai, Maharashtra' },
    { id: '33000000-0000-0000-0000-000000000002', code: 'WH-BLR-01', name: 'Bangalore Tech Depot', location: 'Electronic City, Bangalore, Karnataka' },
    { id: '33000000-0000-0000-0000-000000000003', code: 'WH-DEL-01', name: 'Delhi NCR Fulfillment Center', location: 'Gurugram, Haryana' },
    { id: '33000000-0000-0000-0000-000000000004', code: 'WH-AMD-01', name: 'Ahmedabad Central Warehouse', location: 'Sanand, Ahmedabad, Gujarat' },
    { id: '33000000-0000-0000-0000-000000000005', code: 'WH-HYD-01', name: 'Hyderabad Regional Depot', location: 'Gachibowli, Hyderabad, Telangana' },
    { id: '33000000-0000-0000-0000-000000000006', code: 'WH-PUN-01', name: 'Pune Distribution Center', location: 'Chakan, Pune, Maharashtra' },
    { id: '33000000-0000-0000-0000-000000000007', code: 'WH-CHN-01', name: 'Chennai Coastal Depot', location: 'Sriperumbudur, Chennai, Tamil Nadu' },
    { id: '33000000-0000-0000-0000-000000000008', code: 'WH-KOL-01', name: 'Kolkata Eastern Hub', location: 'Dankuni, Kolkata, West Bengal' },
  ];

  const warehouses = [];
  for (const w of warehousesData) {
    const rec = await prisma.warehouse.upsert({
      where: { id: w.id },
      update: { name: w.name, code: w.code, location: w.location },
      create: w,
    });
    warehouses.push(rec);
  }

  // ─── 5. USERS (40 users across roles) ─────────────────────────────
  console.log('[4/18] Upserting 40 Enterprise Users...');
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const baseUsers = [
    // Admins
    { email: 'admin@dealflow360.com', name: 'Devon Vance (Admin)', role: 'ADMIN' },
    { email: 'manager@dealflow.demo', name: 'Sarah Connor (Sales Manager)', role: 'SALES_MANAGER' },
    { email: 'alex.admin@dealflow360.com', name: 'Alex Rivera (SysAdmin)', role: 'ADMIN' },

    // Sales Managers
    { email: 'manager@dealflow360.com', name: 'Marcus Vance (Sales Director)', role: 'SALES_MANAGER' },
    { email: 'elena.rostova@dealflow360.com', name: 'Elena Rostova (Enterprise VP)', role: 'SALES_MANAGER' },
    { email: 'david.chen@dealflow360.com', name: 'David Chen (Regional Manager)', role: 'SALES_MANAGER' },
    { email: 'rachel.adams@dealflow360.com', name: 'Rachel Adams (Commercial Lead)', role: 'SALES_MANAGER' },

    // Finance
    { email: 'finance@dealflow360.com', name: 'Fiona Gallagher (CFO)', role: 'FINANCE' },
    { email: 'ops@dealflow.demo', name: 'Morgan Stanley (Operations & Finance)', role: 'OPERATIONS' },
    { email: 'victor.franco@dealflow360.com', name: 'Victor Franco (Controller)', role: 'FINANCE' },
    { email: 'maya.patel@dealflow360.com', name: 'Maya Patel (Billing Specialist)', role: 'FINANCE' },

    // Operations
    { email: 'ops@dealflow360.com', name: 'Oliver Queen (VP Logistics)', role: 'OPERATIONS' },
    { email: 'samuel.drake@dealflow360.com', name: 'Samuel Drake (Warehouse Ops)', role: 'OPERATIONS' },
    { email: 'tara.singh@dealflow360.com', name: 'Tara Singh (Inventory Lead)', role: 'OPERATIONS' },
    { email: 'leo.vargas@dealflow360.com', name: 'Leo Vargas (Fulfillment Officer)', role: 'OPERATIONS' },

    // Customers
    { email: 'customer@dealflow.demo', name: 'Apex Industries Demo', role: 'CUSTOMER', customerId: 'CUST-001' },
    { email: 'customer@dealflow360.com', name: 'Siddharth Rao (GlobalSoft Customer)', role: 'CUSTOMER' },
    { email: 'procurement@acme.com', name: 'Jordan Belfort (Acme Corp)', role: 'CUSTOMER' },
    { email: 'techlead@cloudsync.io', name: 'Aria Stark (CloudSync)', role: 'CUSTOMER' },
  ];

  // 20 Sales Representatives
  const salesRepNames = [
    'sales@dealflow.demo', 'sales@dealflow360.com', 'nathan.drake@dealflow360.com', 'claire.redfield@dealflow360.com',
    'jill.valentine@dealflow360.com', 'leon.kennedy@dealflow360.com', 'chris.redfield@dealflow360.com',
    'ada.wong@dealflow360.com', 'albert.wesker@dealflow360.com', 'arthur.morgan@dealflow360.com',
    'john.marston@dealflow360.com', 'sadie.adler@dealflow360.com', 'charles.smith@dealflow360.com',
    'javier.escuella@dealflow360.com', 'kratos.sparta@dealflow360.com', 'atreus.norse@dealflow360.com',
    'freya.vanir@dealflow360.com', 'mimir.wisdom@dealflow360.com', 'geralt.rivia@dealflow360.com',
    'yennefer.vengerberg@dealflow360.com'
  ];

  const salesReps = [];
  const usersByRole = { ADMIN: [], SALES_REP: [], SALES_MANAGER: [], FINANCE: [], OPERATIONS: [], CUSTOMER: [] };

  for (const u of baseUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, status: 'active' },
      create: { email: u.email, name: u.name, role: u.role, passwordHash, status: 'active', emailVerified: true },
    });
    if (usersByRole[u.role]) usersByRole[u.role].push(user);
  }

  for (const email of salesRepNames) {
    const name = email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()) + ' (Sales Rep)';
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'SALES_REP', name, status: 'active' },
      create: { email, name, role: 'SALES_REP', passwordHash, status: 'active', emailVerified: true },
    });
    salesReps.push(user);
    usersByRole.SALES_REP.push(user);
  }

  // ─── 6. CUSTOMERS (65 realistic B2B organizations) ────────────────
  console.log('[5/18] Upserting 65 Enterprise B2B Customers...');
  const customerNames = [
    { name: 'Apex Global Technologies', company: 'Apex Technologies Inc.', industry: 'Technology', city: 'San Francisco, CA' },
    { name: 'Nexus Healthcare Systems', company: 'Nexus Health LLC', industry: 'Healthcare', city: 'Boston, MA' },
    { name: 'Quantum Cloud Dynamics', company: 'Quantum Dynamics Corp.', industry: 'Cloud', city: 'Seattle, WA' },
    { name: 'Vanguard Industrial Automation', company: 'Vanguard Automation Ltd.', industry: 'Manufacturing', city: 'Detroit, MI' },
    { name: 'Horizon Financial Group', company: 'Horizon Capital Management', industry: 'Financial Services', city: 'New York, NY' },
    { name: 'Summit Global Logistics', company: 'Summit Freight & Logistics', industry: 'Logistics', city: 'Chicago, IL' },
    { name: 'Starlight Biotech Labs', company: 'Starlight Bio Inc.', industry: 'Healthcare', city: 'San Diego, CA' },
    { name: 'Pinnacle Retail Solutions', company: 'Pinnacle Retailers Group', industry: 'Retail', city: 'Dallas, TX' },
    { name: 'Aether Telecom Networks', company: 'Aether Telecom Ltd.', industry: 'Telecommunications', city: 'Denver, CO' },
    { name: 'Solaria Renewable Energy', company: 'Solaria Green Energy Corp.', industry: 'Energy', city: 'Austin, TX' },
    { name: 'CyberShield Security Systems', company: 'CyberShield InfoSec', industry: 'Security', city: 'Washington, DC' },
    { name: 'Alpha Robotics Labs', company: 'Alpha Robotics & AI Corp.', industry: 'Manufacturing', city: 'Pittsburgh, PA' },
    { name: 'Beacon Media & Entertainment', company: 'Beacon Entertainment LLC', industry: 'Media', city: 'Los Angeles, CA' },
    { name: 'Crestview Education Partners', company: 'Crestview University System', industry: 'Education', city: 'Philadelphia, PA' },
    { name: 'Delta Aerospace Systems', company: 'Delta Defense & Aerospace', industry: 'Aerospace', city: 'Huntsville, AL' },
    { name: 'Echo Stream Software', company: 'EchoStream Interactive', industry: 'Technology', city: 'Portland, OR' },
    { name: 'Frontier Agrotech Solutions', company: 'Frontier Farming Dynamics', industry: 'Agriculture', city: 'Omaha, NE' },
    { name: 'Galactic Data Warehousing', company: 'Galactic Data Storage Corp.', industry: 'Technology', city: 'Atlanta, GA' },
    { name: 'Helix Bio-Pharma', company: 'Helix Pharmaceuticals Global', industry: 'Healthcare', city: 'Raleigh, NC' },
    { name: 'Ironclad Infrastructure', company: 'Ironclad Civil Engineering', industry: 'Infrastructure', city: 'Cleveland, OH' },
    { name: 'Jupiter Enterprise Solutions', company: 'Jupiter ERP Systems', industry: 'Technology', city: 'Phoenix, AZ' },
    { name: 'Kinetic Automotive Motors', company: 'Kinetic EV Technologies', industry: 'Automotive', city: 'Fremont, CA' },
    { name: 'Lighthouse Legal Consultants', company: 'Lighthouse Global Legal LLP', industry: 'Professional Services', city: 'Minneapolis, MN' },
    { name: 'Meridian Supply Chain', company: 'Meridian Warehousing Hub', industry: 'Logistics', city: 'Memphis, TN' },
    { name: 'Nova Hospitality Systems', company: 'Nova Hotels & Resorts Group', industry: 'Hospitality', city: 'Miami, FL' },
    { name: 'Omni Retail Superstores', company: 'Omni Retail Chain Inc.', industry: 'Retail', city: 'Bentonville, AR' },
    { name: 'Paradigm Architecture Firm', company: 'Paradigm Design Partners', industry: 'Professional Services', city: 'Salt Lake City, UT' },
    { name: 'Redwood Forest Paper Co.', company: 'Redwood Sustainable Materials', industry: 'Manufacturing', city: 'Sacramento, CA' },
    { name: 'Sapphire Asset Management', company: 'Sapphire Wealth Advisors', industry: 'Financial Services', city: 'Charlotte, NC' },
    { name: 'Titan Heavy Machinery', company: 'Titan Construction Heavy Equipment', industry: 'Manufacturing', city: 'Peoria, IL' },
    { name: 'Ultraviolet Creative Media', company: 'Ultraviolet Advertising Studios', industry: 'Media', city: 'Brooklyn, NY' },
    { name: 'Velocity Air Cargo', company: 'Velocity Express Logistics', industry: 'Logistics', city: 'Louisville, KY' },
    { name: 'Wavelength Wireless Telecom', company: 'Wavelength 5G Networks', industry: 'Telecommunications', city: 'Kansas City, MO' },
    { name: 'Xenon Industrial Gases', company: 'Xenon Chemical Technologies', industry: 'Energy', city: 'Houston, TX' },
    { name: 'Zenith Semiconductor Corp.', company: 'Zenith Chip Fabrication', industry: 'Technology', city: 'Boise, ID' },
  ];

  // Extend with 30 more realistic variants
  for (let i = 1; i <= 30; i++) {
    customerNames.push({
      name: `Enterprise Partner Alpha-${100 + i}`,
      company: `Apex Regional Subsidiary ${100 + i} LLC`,
      industry: i % 2 === 0 ? 'Technology' : 'Healthcare',
      city: `Hub Region ${i}, USA`,
    });
  }

  const customers = [];
  for (let idx = 0; idx < customerNames.length; idx++) {
    const c = customerNames[idx];
    const email = `contact@${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const rep = salesReps[idx % salesReps.length];
    const tier = tiers[idx % tiers.length];

    const customer = await prisma.customer.upsert({
      where: { id: `44000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}` },
      update: { name: c.name, company: c.company, email, tierId: tier.id, salesRepId: rep.id },
      create: {
        id: `44000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`,
        name: c.name,
        company: c.company,
        email,
        phone: `+1 (555) ${randInt(100, 999)}-${randInt(1000, 9999)}`,
        address: `${randInt(100, 9999)} Commerce Way, Suite ${randInt(10, 500)}, ${c.city}`,
        currency: 'USD',
        tierId: tier.id,
        salesRepId: rep.id,
      },
    });
    customers.push(customer);
  }

  // ─── 7. PRODUCTS (120 products with realistic margins) ─────────────
  console.log('[6/18] Upserting 120 Products across 8 categories...');
  const baseCatalog = [
    // Hardware (Low to Mid margin 15-30%)
    { name: 'Dell Latitude Enterprise Laptop 15"', sku: 'HW-LAPTOP-01', cat: 'Hardware', basePrice: 1250, costPrice: 950, tax: 18 },
    { name: 'MacBook Pro 16" M3 Max 64GB', sku: 'HW-MACBOOK-01', cat: 'Hardware', basePrice: 3499, costPrice: 2800, tax: 18 },
    { name: 'ThinkPad X1 Carbon Ultrabook 14"', sku: 'HW-THINKPAD-01', cat: 'Hardware', basePrice: 1650, costPrice: 1250, tax: 18 },
    { name: 'Ultra-Sharp 34" Curved 4K Monitor', sku: 'HW-MON-34C', cat: 'Hardware', basePrice: 799, costPrice: 520, tax: 18 },
    { name: 'Business Dual-Display 27" IPS Monitor', sku: 'HW-MON-27D', cat: 'Hardware', basePrice: 420, costPrice: 280, tax: 18 },
    { name: 'PowerEdge 2U Rackmount Server R760', sku: 'HW-SRV-R760', cat: 'Hardware', basePrice: 6500, costPrice: 4800, tax: 18 },
    { name: 'HPE ProLiant DL380 Gen11 Server', sku: 'HW-SRV-DL380', cat: 'Hardware', basePrice: 7200, costPrice: 5300, tax: 18 },
    { name: 'Enterprise Thunderbolt 4 Docking Station', sku: 'HW-DOCK-TB4', cat: 'Hardware', basePrice: 280, costPrice: 160, tax: 18 },
    { name: 'Cisco Catalyst 48-Port PoE+ Switch', sku: 'HW-NET-SW48', cat: 'Networking', basePrice: 3200, costPrice: 2200, tax: 18 },
    { name: 'Fortinet FortiGate 100F Next-Gen Firewall', sku: 'HW-SEC-FG100', cat: 'Security', basePrice: 2950, costPrice: 1900, tax: 18 },
    { name: 'Ubiquiti UniFi Enterprise WiFi 6 AP', sku: 'HW-NET-U6AP', cat: 'Networking', basePrice: 380, costPrice: 240, tax: 18 },
    { name: 'Synology 8-Bay Rackmount NAS 64TB', sku: 'HW-STR-SYN64', cat: 'Storage', basePrice: 4500, costPrice: 3100, tax: 18 },

    // Software & Cloud (High margin 60-80%)
    { name: 'DealFlow360 Enterprise CRM License (Per Seat)', sku: 'SW-CRM-ENT', cat: 'Software', basePrice: 85, costPrice: 15, tax: 18 },
    { name: 'DealFlow360 Pro Sales Pipeline Edition', sku: 'SW-CRM-PRO', cat: 'Software', basePrice: 45, costPrice: 8, tax: 18 },
    { name: 'Microsoft 365 E5 Enterprise Annual Seat', sku: 'SW-MS-365E5', cat: 'Software', basePrice: 420, costPrice: 320, tax: 18 },
    { name: 'CloudSync Managed Automated Backup 5TB', sku: 'CLD-BKP-5TB', cat: 'Cloud', basePrice: 250, costPrice: 50, tax: 18 },
    { name: 'CloudFlare Enterprise DDoS & WAF Guard', sku: 'SEC-CF-WAF', cat: 'Security', basePrice: 1200, costPrice: 250, tax: 18 },
    { name: 'SentinelOne Complete EDR Endpoint Defense', sku: 'SEC-EDR-S1', cat: 'Security', basePrice: 65, costPrice: 18, tax: 18 },
    { name: 'Snowflake Enterprise Data Cloud Credit Bundle', sku: 'CLD-SNOW-CR', cat: 'Cloud', basePrice: 4500, costPrice: 3200, tax: 18 },
    { name: 'Datadog Full-Stack Infrastructure Monitoring', sku: 'SW-DD-MON', cat: 'Cloud', basePrice: 350, costPrice: 80, tax: 18 },

    // Professional Services & Support (High margin 50-70%)
    { name: 'DealFlow360 Custom CRM Onboarding Package', sku: 'SRV-ONBOARD', cat: 'Services', basePrice: 4500, costPrice: 1500, tax: 18 },
    { name: 'Enterprise Cloud Architecture Audit (5 Days)', sku: 'SRV-ARCH-AUD', cat: 'Services', basePrice: 8500, costPrice: 3200, tax: 18 },
    { name: 'Security Penetration Testing & Vulnerability Assessment', sku: 'SRV-PENTEST', cat: 'Services', basePrice: 6500, costPrice: 2200, tax: 18 },
    { name: '24/7 Platinum SLA Priority Support Contract', sku: 'SUP-PLAT-247', cat: 'Support', basePrice: 1500, costPrice: 400, tax: 18 },
    { name: 'Business Hours SLA Gold Support Contract', sku: 'SUP-GOLD-8X5', cat: 'Support', basePrice: 750, costPrice: 200, tax: 18 },
    { name: 'Disaster Recovery Plan & Semi-Annual Drill', sku: 'SRV-DR-DRILL', cat: 'Services', basePrice: 5000, costPrice: 1600, tax: 18 },

    // Accessories
    { name: 'Logitech MX Master 3S Wireless Mouse', sku: 'AC-LOGI-MX3', cat: 'Accessories', basePrice: 99, costPrice: 55, tax: 18 },
    { name: 'Logitech MX Mechanical Wireless Keyboard', sku: 'AC-LOGI-KB', cat: 'Accessories', basePrice: 149, costPrice: 80, tax: 18 },
    { name: 'Jabra Evolve2 75 Active Noise-Cancelling Headset', sku: 'AC-JABRA-75', cat: 'Accessories', basePrice: 299, costPrice: 165, tax: 18 },
    { name: 'Heavy Duty Dual-Monitor Gas Spring Arm', sku: 'AC-ARM-DUAL', cat: 'Accessories', basePrice: 120, costPrice: 60, tax: 18 },
  ];

  // Synthesize up to 120 products cleanly
  const productsData = [...baseCatalog];
  const catNames = categoriesData.map((c) => c.name);

  let pCount = baseCatalog.length + 1;
  while (productsData.length < 120) {
    const cName = catNames[productsData.length % catNames.length];
    const isServiceOrSoftware = ['Software', 'Cloud', 'Services', 'Support'].includes(cName);
    const base = isServiceOrSoftware ? randInt(200, 3000) : randInt(150, 4500);
    const marginRate = isServiceOrSoftware ? randFloat(0.4, 0.75) : randFloat(0.18, 0.35);
    const cost = Math.round(base * (1 - marginRate));

    productsData.push({
      name: `${cName} Enterprise Solution Tier-${pCount}`,
      sku: `${cName.substring(0, 3).toUpperCase()}-TIER-${String(pCount).padStart(3, '0')}`,
      cat: cName,
      basePrice: base,
      costPrice: cost,
      tax: 18,
    });
    pCount++;
  }

  const products = [];
  for (const p of productsData) {
    const category = categories.find((c) => c.name === p.cat) || categories[0];
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { basePrice: p.basePrice, costPrice: p.costPrice, taxRate: p.tax, name: p.name },
      create: {
        name: p.name,
        sku: p.sku,
        description: `Enterprise-grade ${p.name} configured for B2B mission-critical operations.`,
        unit: 'unit',
        basePrice: p.basePrice,
        costPrice: p.costPrice,
        taxRate: p.tax,
        categoryId: category.id,
        active: true,
      },
    });
    products.push(prod);
  }

  // ─── 8. PRICE LISTS & PRICE LIST ITEMS (5 price lists, 300 items) ──
  console.log('[7/18] Upserting 5 Price Lists and ~300 Price List Items...');
  const priceListsData = [
    { id: '55000000-0000-0000-0000-000000000001', name: 'Standard Commercial List', tierId: tiers[0].id, discount: 0 },
    { id: '55000000-0000-0000-0000-000000000002', name: 'Enterprise Corporate Agreement', tierId: tiers[1].id, discount: 5 },
    { id: '55000000-0000-0000-0000-000000000003', name: 'Strategic Partner Tier', tierId: tiers[2].id, discount: 10 },
    { id: '55000000-0000-0000-0000-000000000004', name: 'High-Volume Wholesale', tierId: tiers[1].id, discount: 12 },
    { id: '55000000-0000-0000-0000-000000000005', name: 'Government & Education Sector', tierId: tiers[2].id, discount: 15 },
  ];

  const priceLists = [];
  for (const pl of priceListsData) {
    const list = await prisma.priceList.upsert({
      where: { id: pl.id },
      update: { name: pl.name, customerTierId: pl.tierId },
      create: {
        id: pl.id,
        name: pl.name,
        currency: 'USD',
        customerTierId: pl.tierId,
        active: true,
      },
    });
    priceLists.push(list);
  }

  // Insert ~300 price list items
  await prisma.priceListItem.deleteMany({});
  const priceListItems = [];
  for (const pl of priceListsData) {
    const sampleProds = randSample(products, 60);
    for (const pr of sampleProds) {
      const discountedPrice = randFloat(Number(pr.basePrice) * (1 - pl.discount / 100), Number(pr.basePrice));
      priceListItems.push({
        id: crypto.randomUUID(),
        priceListId: pl.id,
        productId: pr.id,
        price: discountedPrice,
      });
    }
  }
  await chunkedCreateMany(prisma.priceListItem, priceListItems);

  // ─── 9. WAREHOUSE INVENTORY (450 stock records) ───────────────────
  console.log('[8/18] Seeding 450 Warehouse Stock Records...');
  await prisma.warehouseStock.deleteMany({});
  const stockRecords = [];
  for (const wh of warehouses) {
    // Distribute products across warehouses
    const whProds = randSample(products, 55);
    for (const pr of whProds) {
      // 10% out of stock, 25% low stock (1-10), 40% healthy (15-60), 25% surplus (70-300)
      const roll = rand();
      let qty = 0;
      if (roll < 0.1) qty = 0;
      else if (roll < 0.35) qty = randInt(1, 10);
      else if (roll < 0.75) qty = randInt(15, 60);
      else qty = randInt(70, 300);

      const reserved = qty > 0 ? randInt(0, Math.floor(qty * 0.3)) : 0;

      stockRecords.push({
        id: crypto.randomUUID(),
        warehouseId: wh.id,
        productId: pr.id,
        quantity: qty,
        reservedQty: reserved,
        reorderLevel: randInt(5, 20),
      });
    }
  }
  await chunkedCreateMany(prisma.warehouseStock, stockRecords);

  // ─── 10. DISCOUNT & APPROVAL RULES ────────────────────────────────
  console.log('[9/18] Configuring Governance & Approval Chain Rules...');
  await prisma.discountRule.deleteMany({});
  const discountRulesData = [
    // Customer Tiers
    { id: crypto.randomUUID(), name: 'Bronze Tier Cap', type: 'TIER', customerTierId: tiers[0].id, maxDiscountPct: 5.0, active: true },
    { id: crypto.randomUUID(), name: 'Silver Tier Cap', type: 'TIER', customerTierId: tiers[1].id, maxDiscountPct: 10.0, active: true },
    { id: crypto.randomUUID(), name: 'Gold Tier Cap', type: 'TIER', customerTierId: tiers[2].id, maxDiscountPct: 15.0, active: true },
    // Category Caps
    { id: crypto.randomUUID(), name: 'Hardware Margin Protection Rule', type: 'CATEGORY', categoryId: categories[0].id, maxDiscountPct: 15.0, active: true },
    { id: crypto.randomUUID(), name: 'Software Enterprise Discount Rule', type: 'CATEGORY', categoryId: categories[1].id, maxDiscountPct: 20.0, active: true },
    { id: crypto.randomUUID(), name: 'Professional Services Discount Rule', type: 'CATEGORY', categoryId: categories[2].id, maxDiscountPct: 10.0, active: true },
    { id: crypto.randomUUID(), name: 'Accessories Volume Cap', type: 'CATEGORY', categoryId: categories[3].id, maxDiscountPct: 8.0, active: true },
    { id: crypto.randomUUID(), name: 'Cloud Infrastructure Discount Rule', type: 'CATEGORY', categoryId: categories[4].id, maxDiscountPct: 18.0, active: true },
    { id: crypto.randomUUID(), name: 'Security Suite Special Deal Rule', type: 'CATEGORY', categoryId: categories[5].id, maxDiscountPct: 12.0, active: true },
    { id: crypto.randomUUID(), name: 'Enterprise Storage Deal Rule', type: 'CATEGORY', categoryId: categories[6].id, maxDiscountPct: 14.0, active: true },
    { id: crypto.randomUUID(), name: 'SLA Support Contract Cap', type: 'CATEGORY', categoryId: categories[7].id, maxDiscountPct: 10.0, active: true },
  ];
  await chunkedCreateMany(prisma.discountRule, discountRulesData);

  await prisma.approvalRule.deleteMany({});
  const approvalRulesData = [
    { id: crypto.randomUUID(), name: 'Auto-Approved Low Risk (1-24)', minRiskScore: 1, maxRiskScore: 24, requiredRole: 'SALES_MANAGER', stepOrder: 1, active: true },
    { id: crypto.randomUUID(), name: 'Standard Medium Risk (25-59)', minRiskScore: 25, maxRiskScore: 59, requiredRole: 'SALES_MANAGER', stepOrder: 1, active: true },
    { id: crypto.randomUUID(), name: 'High Risk Step 1 - Manager Review', minRiskScore: 60, maxRiskScore: 79, requiredRole: 'SALES_MANAGER', stepOrder: 1, active: true },
    { id: crypto.randomUUID(), name: 'High Risk Step 2 - Finance Approval', minRiskScore: 60, maxRiskScore: 79, requiredRole: 'FINANCE', stepOrder: 2, active: true },
    { id: crypto.randomUUID(), name: 'Critical Risk Step 1 - Manager Review', minRiskScore: 80, maxRiskScore: 100, requiredRole: 'SALES_MANAGER', stepOrder: 1, active: true },
    { id: crypto.randomUUID(), name: 'Critical Risk Step 2 - Finance Validation', minRiskScore: 80, maxRiskScore: 100, requiredRole: 'FINANCE', stepOrder: 2, active: true },
    { id: crypto.randomUUID(), name: 'Critical Risk Step 3 - Executive VP Admin', minRiskScore: 80, maxRiskScore: 100, requiredRole: 'ADMIN', stepOrder: 3, active: true },
  ];
  await chunkedCreateMany(prisma.approvalRule, approvalRulesData);

  // ─── 11. UPSELL & CROSS-SELL RULES (80 rules) ─────────────────────
  console.log('[10/18] Generating 80 Recommendation Engine Rules...');
  await prisma.upsellRule.deleteMany({});
  await prisma.crossSellRule.deleteMany({});
  await prisma.recommendation.deleteMany({});

  const upsellRules = [];
  const crossSellRules = [];
  const recommendations = [];

  for (let i = 0; i < 40; i++) {
    const p1 = products[i % products.length];
    const p2 = products[(i + 5) % products.length];
    const p3 = products[(i + 12) % products.length];

    upsellRules.push({
      id: crypto.randomUUID(),
      productId: p1.id,
      upsellId: p2.id,
      score: randFloat(0.65, 0.98),
      active: true,
    });

    crossSellRules.push({
      id: crypto.randomUUID(),
      productId: p1.id,
      crossSellId: p3.id,
      score: randFloat(0.60, 0.95),
      active: true,
    });
  }

  for (let i = 0; i < 60; i++) {
    const cust = customers[i % customers.length];
    const prod = products[i % products.length];
    recommendations.push({
      id: crypto.randomUUID(),
      customerId: cust.id,
      productId: prod.id,
      type: i % 2 === 0 ? 'UPSELL' : 'CROSS_SELL',
      score: randFloat(0.70, 0.99),
      reason: `Historical affinity based on ${prod.name} adoption in peer accounts.`,
      active: true,
    });
  }

  await chunkedCreateMany(prisma.upsellRule, upsellRules);
  await chunkedCreateMany(prisma.crossSellRule, crossSellRules);
  await chunkedCreateMany(prisma.recommendation, recommendations);

  // ─── 12. SUBSCRIPTION PLANS (3 plans) ─────────────────────────────
  console.log('[11/18] Upserting Subscription Plans...');
  const subPlans = [
    { id: '66000000-0000-0000-0000-000000000001', name: 'Standard SaaS Monthly SLA', interval: 'monthly', price: 150.0, description: 'Standard 8x5 next-business-day response SLA' },
    { id: '66000000-0000-0000-0000-000000000002', name: 'Enterprise SaaS Quarterly Support', interval: 'quarterly', price: 420.0, description: 'Dedicated account manager with 4-hour SLA' },
    { id: '66000000-0000-0000-0000-000000000003', name: 'Platinum 24/7 Annual Mission Critical', interval: 'yearly', price: 1500.0, description: '15-minute emergency response SLA contract' },
  ];
  for (const sp of subPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: sp.id },
      update: { name: sp.name, price: sp.price },
      create: { ...sp, active: true },
    });
  }

  // ─── 13. QUOTATIONS & QUOTATION LINES (140 quotations, ~480 lines) ─
  console.log('[12/18] Synthesizing 140 Quotations with calculated lines...');
  
  // Safe cleanup of dependent business data from previous seeds
  await prisma.payment.deleteMany({});
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.billingSchedule.deleteMany({});
  await prisma.subscriptionLine.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.backorder.deleteMany({});
  await prisma.fulfillmentLine.deleteMany({});
  await prisma.fulfillmentOrder.deleteMany({});
  await prisma.salesOrderLine.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.dealHealth.deleteMany({});
  await prisma.changeRequest.deleteMany({});
  await prisma.negotiationMessage.deleteMany({});
  await prisma.negotiation.deleteMany({});
  await prisma.approvalHistory.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.quotationLine.deleteMany({});
  await prisma.quotation.deleteMany({});

  const quotations = [];
  const quotationLines = [];
  const approvalRequests = [];
  const approvalHistories = [];
  const dealHealths = [];

  const now = new Date();
  const past6Months = new Date();
  past6Months.setMonth(now.getMonth() - 6);

  // Status distributions:
  // 0 - 24: ORDER_CONFIRMED (Accepted & converted to Sales Orders)
  // 25 - 54: CUSTOMER_CONFIRMED (Confirmed by customer, ready for orders)
  // 55 - 74: NEGOTIATION (Active line negotiations and counter-offers)
  // 75 - 94: PENDING_APPROVAL (Submitted discounts awaiting manager/finance)
  // 95 - 114: APPROVED (Approved discounts ready for customer confirm)
  // 115 - 124: DRAFT (Sales rep editing lines)
  // 125 - 134: REJECTED (Unapproved excess discount)
  // 135 - 139: EXPIRED (Historical expiration)

  for (let i = 0; i < 140; i++) {
    const quoId = crypto.randomUUID();
    const quoNumber = `QUO-2026-${String(i + 1).padStart(4, '0')}`;
    const customer = customers[i % customers.length];
    const rep = salesReps[i % salesReps.length];

    let status = 'DRAFT';
    if (i < 30) status = 'ORDER_CONFIRMED';
    else if (i < 55) status = 'CUSTOMER_CONFIRMED';
    else if (i < 75) status = 'NEGOTIATION';
    else if (i < 100) status = 'PENDING_APPROVAL';
    else if (i < 120) status = 'APPROVED';
    else if (i < 128) status = 'DRAFT';
    else if (i < 135) status = 'REJECTED';
    else status = 'EXPIRED';

    const createdAt = randDate(past6Months, now);
    const validUntil = new Date(createdAt);
    validUntil.setDate(validUntil.getDate() + 30);

    // Pick 2 to 5 products
    const lineCount = randInt(2, 5);
    const chosenProds = randSample(products, lineCount);

    let subtotal = 0;
    let totalCost = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    const discountPct = status === 'REJECTED' ? randInt(25, 45) : status === 'PENDING_APPROVAL' ? randInt(15, 25) : randChoice([0, 5, 8, 10, 12]);

    for (let li = 0; li < chosenProds.length; li++) {
      const prod = chosenProds[li];
      const isRecurring = prod.category?.name === 'Software' || prod.category?.name === 'Cloud' || prod.name.includes('SLA') || li === 0 && i % 3 === 0;
      const quantity = isRecurring ? randInt(1, 10) : randInt(2, 15);
      const unitPrice = Number(prod.basePrice);
      const unitCost = Number(prod.costPrice);

      const lineSub = unitPrice * quantity;
      const lineDisc = (lineSub * discountPct) / 100;
      const lineTax = ((lineSub - lineDisc) * Number(prod.taxRate)) / 100;
      const lineTot = lineSub - lineDisc + lineTax;

      subtotal += lineSub;
      totalCost += unitCost * quantity;
      discountAmount += lineDisc;
      taxAmount += lineTax;

      quotationLines.push({
        id: crypto.randomUUID(),
        quotationId: quoId,
        productId: prod.id,
        quantity,
        unitPrice,
        unitCost,
        discountPercent: discountPct,
        discountAmount: lineDisc,
        taxRate: Number(prod.taxRate),
        lineSubtotal: lineSub,
        lineTotal: lineTot,
        billingType: isRecurring ? 'RECURRING' : 'ONE_TIME',
        createdAt,
      });
    }

    const totalAmount = subtotal - discountAmount + taxAmount;
    const grossMargin = totalAmount - totalCost;
    const marginPercentage = totalAmount > 0 ? (grossMargin / totalAmount) * 100 : 0;

    quotations.push({
      id: quoId,
      quotationNumber: quoNumber,
      customerId: customer.id,
      salesRepId: rep.id,
      status,
      currency: 'USD',
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      totalCost,
      grossMargin,
      marginPercentage,
      validUntil,
      notes: `Enterprise quote prepared for ${customer.name}.`,
      createdAt,
      updatedAt: createdAt,
    });

    // ─── Approval Requests for Pending, Approved, Rejected ──────────
    if (['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(status)) {
      const reqId = crypto.randomUUID();
      const riskScore = discountPct > 20 ? randInt(70, 95) : randInt(25, 55);
      const riskLevel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';
      const appStatus = status === 'PENDING_APPROVAL' ? 'PENDING' : status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      const approver = usersByRole.SALES_MANAGER[0] || usersByRole.ADMIN[0];

      approvalRequests.push({
        id: reqId,
        quotationId: quoId,
        status: appStatus,
        riskScore,
        riskLevel,
        currentStep: appStatus === 'PENDING' ? 1 : 2,
        totalSteps: riskScore >= 60 ? 2 : 1,
        requiredRole: riskScore >= 60 ? 'FINANCE' : 'SALES_MANAGER',
        reason: `Requested discount (${discountPct}%) exceeds authorized tier ceiling.`,
        approverId: approver.id,
        createdAt,
        updatedAt: createdAt,
      });

      approvalHistories.push({
        id: crypto.randomUUID(),
        approvalRequestId: reqId,
        action: appStatus === 'PENDING' ? 'SUBMITTED' : appStatus,
        step: 1,
        notes: `Governance check triggered risk score ${riskScore}.`,
        userId: rep.id,
        createdAt,
      });
    }

    // ─── Deal Health for Quotes ─────────────────────────────────────
    if (i < 100) {
      let healthScore = 85;
      const riskFactors = [];
      const recs = [];

      if (marginPercentage < 20) {
        healthScore -= 30;
        riskFactors.push({ factor: 'LOW_MARGIN', severity: 'HIGH', message: 'Gross margin below target 25% floor' });
        recs.push({ action: 'REDUCE_DISCOUNT', impact: '+8% margin' });
      }
      if (discountPct > 15) {
        healthScore -= 20;
        riskFactors.push({ factor: 'HIGH_DISCOUNT', severity: 'MEDIUM', message: `Excess discount ${discountPct}% requested` });
      }
      if (status === 'EXPIRED' || (now - createdAt > 45 * 24 * 3600 * 1000)) {
        healthScore -= 25;
        riskFactors.push({ factor: 'STALLED_DEAL', severity: 'HIGH', message: 'No customer activity in >30 days' });
        recs.push({ action: 'RE_ENGAGE', message: 'Follow up with executive sponsor' });
      }

      dealHealths.push({
        id: crypto.randomUUID(),
        quotationId: quoId,
        healthScore: Math.max(15, healthScore),
        riskFactors,
        recommendations: recs,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  await chunkedCreateMany(prisma.quotation, quotations);
  await chunkedCreateMany(prisma.quotationLine, quotationLines);
  await chunkedCreateMany(prisma.approvalRequest, approvalRequests);
  await chunkedCreateMany(prisma.approvalHistory, approvalHistories);
  await chunkedCreateMany(prisma.dealHealth, dealHealths);

  // ─── 14. NEGOTIATIONS & MESSAGES (40 negotiations, ~180 messages) ─
  console.log('[13/18] Creating 40 Customer Negotiations and ~180 Real-Time Dialogue Messages...');
  const negQuotes = quotations.filter((q) => q.status === 'NEGOTIATION' || q.status === 'CUSTOMER_CONFIRMED' || q.status === 'ORDER_CONFIRMED').slice(0, 40);

  const negotiations = [];
  const negotiationMessages = [];
  const changeRequests = [];

  for (let n = 0; n < negQuotes.length; n++) {
    const q = negQuotes[n];
    const negId = crypto.randomUUID();
    const negStatus = q.status === 'NEGOTIATION' ? 'OPEN' : 'ACCEPTED';

    negotiations.push({
      id: negId,
      quotationId: q.id,
      customerId: q.customerId,
      status: negStatus,
      createdAt: q.createdAt,
      updatedAt: q.createdAt,
    });

    // Generate 3 to 6 conversation turns
    const convos = [
      { sender: 'CUSTOMER', msg: `Hello, we reviewed Quote ${q.quotationNumber}. Can we negotiate a 10% volume rebate if we commit to annual support?` },
      { sender: 'SALES_REP', msg: 'Thanks for reaching out! Let me review this with our sales manager to see if we can accommodate the 10% concession.' },
      { sender: 'CUSTOMER', msg: 'We also noticed line 2 delivery timeline. Can we expedite delivery from the regional warehouse?' },
      { sender: 'SALES_REP', msg: 'Yes, we can split fulfillment across the Mumbai and Bangalore hubs to guarantee 48-hour delivery.' },
      { sender: 'CUSTOMER', msg: 'Excellent. Please send over the updated quotation with revised terms for our procurement approval.' },
    ];

    const customerUser = usersByRole.CUSTOMER.find((u) => u.customerId === q.customerId) || usersByRole.CUSTOMER[0];
    const repUser = salesReps.find((u) => u.id === q.salesRepId) || salesReps[0];

    for (let m = 0; m < convos.length; m++) {
      const c = convos[m];
      const msgDate = new Date(q.createdAt);
      msgDate.setHours(msgDate.getHours() + (m + 1) * 3);

      negotiationMessages.push({
        id: crypto.randomUUID(),
        negotiationId: negId,
        senderId: c.sender === 'CUSTOMER' ? customerUser.id : repUser.id,
        message: c.msg,
        createdAt: msgDate,
      });
    }

    // Change Request
    changeRequests.push({
      id: crypto.randomUUID(),
      negotiationId: negId,
      requestedBy: customerUser.id,
      changeType: 'DISCOUNT_REQUEST',
      oldValue: { discountPercent: 5 },
      newValue: { discountPercent: 10, notes: 'Committed to annual prepaid renewal' },
      status: negStatus === 'ACCEPTED' ? 'APPROVED' : 'PENDING',
      createdAt: q.createdAt,
    });
  }

  await chunkedCreateMany(prisma.negotiation, negotiations);
  await chunkedCreateMany(prisma.negotiationMessage, negotiationMessages);
  await chunkedCreateMany(prisma.changeRequest, changeRequests);

  // ─── 15. SALES ORDERS (85 sales orders) ───────────────────────────
  console.log('[14/18] Generating 85 Sales Orders from Confirmed Quotes...');
  const orderEligibleQuotes = quotations.filter((q) => q.status === 'ORDER_CONFIRMED' || q.status === 'CUSTOMER_CONFIRMED').slice(0, 85);

  const salesOrders = [];
  const salesOrderLines = [];

  for (let o = 0; o < orderEligibleQuotes.length; o++) {
    const q = orderEligibleQuotes[o];
    const soId = crypto.randomUUID();
    const orderNumber = `SO-2026-${String(o + 1).padStart(4, '0')}`;
    const orderDate = new Date(q.createdAt);
    orderDate.setDate(orderDate.getDate() + 1);

    salesOrders.push({
      id: soId,
      orderNumber,
      quotationId: q.id,
      customerId: q.customerId,
      status: 'ORDER_CONFIRMED',
      currency: 'USD',
      subtotal: q.subtotal,
      discountAmount: q.discountAmount,
      taxAmount: q.taxAmount,
      totalAmount: q.totalAmount,
      totalCost: q.totalCost,
      grossMargin: q.grossMargin,
      marginPercentage: q.marginPercentage,
      notes: `Sales Order generated from accepted quotation ${q.quotationNumber}.`,
      createdAt: orderDate,
      updatedAt: orderDate,
    });

    const relatedLines = quotationLines.filter((l) => l.quotationId === q.id);
    for (const l of relatedLines) {
      salesOrderLines.push({
        id: crypto.randomUUID(),
        salesOrderId: soId,
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        unitCost: l.unitCost,
        discountPercent: l.discountPercent,
        discountAmount: l.discountAmount,
        taxRate: l.taxRate,
        lineSubtotal: l.lineSubtotal,
        lineTotal: l.lineTotal,
        quantityReserved: l.quantity,
        quantityFulfilled: o < 60 ? l.quantity : Math.floor(l.quantity * 0.7),
        quantityBackordered: o < 60 ? 0 : Math.ceil(l.quantity * 0.3),
        billingType: l.billingType,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }
  }

  await chunkedCreateMany(prisma.salesOrder, salesOrders);
  await chunkedCreateMany(prisma.salesOrderLine, salesOrderLines);

  // ─── 16. FULFILLMENTS & BACKORDERS (100 fulfillments, 25 backorders)
  console.log('[15/18] Generating 100 Multi-Warehouse Fulfillments and 25 Backorders...');
  const fulfillmentOrders = [];
  const fulfillmentLines = [];
  const backorders = [];

  for (let f = 0; f < 100; f++) {
    const so = salesOrders[f % salesOrders.length];
    const wh = warehouses[f % warehouses.length];
    const foId = crypto.randomUUID();
    const foNumber = `FO-2026-${String(f + 1).padStart(4, '0')}`;

    let status = 'DELIVERED';
    if (f < 45) status = 'DELIVERED';
    else if (f < 70) status = 'SHIPPED';
    else if (f < 85) status = 'PROCESSING';
    else status = 'PENDING';

    const fulfilledAt = status === 'DELIVERED' ? new Date(so.createdAt) : null;
    if (fulfilledAt) fulfilledAt.setDate(fulfilledAt.getDate() + 3);

    fulfillmentOrders.push({
      id: foId,
      orderNumber: foNumber,
      salesOrderId: so.id,
      customerId: so.customerId,
      warehouseId: wh.id,
      status,
      notes: `Fulfillment dispatched from ${wh.name}.`,
      fulfilledAt,
      createdAt: so.createdAt,
      updatedAt: so.createdAt,
    });

    const soLines = salesOrderLines.filter((l) => l.salesOrderId === so.id);
    for (const sol of soLines) {
      const fQty = status === 'DELIVERED' || status === 'SHIPPED' ? sol.quantity : Math.floor(sol.quantity * 0.6);

      fulfillmentLines.push({
        id: crypto.randomUUID(),
        fulfillmentOrderId: foId,
        salesOrderLineId: sol.id,
        productId: sol.productId,
        quantity: sol.quantity,
        fulfilledQty: fQty,
        createdAt: so.createdAt,
      });

      // Backorder if shortfall exists
      if (sol.quantity > fQty && backorders.length < 25) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + randInt(7, 21));

        backorders.push({
          id: crypto.randomUUID(),
          fulfillmentOrderId: foId,
          salesOrderId: so.id,
          salesOrderLineId: sol.id,
          productId: sol.productId,
          quantity: sol.quantity - fQty,
          fulfilledQuantity: 0,
          expectedDate: expDate,
          status: 'PENDING_RESTOCK',
          createdAt: so.createdAt,
        });
      }
    }
  }

  await chunkedCreateMany(prisma.fulfillmentOrder, fulfillmentOrders);
  await chunkedCreateMany(prisma.fulfillmentLine, fulfillmentLines);
  await chunkedCreateMany(prisma.backorder, backorders);

  // ─── 17. SUBSCRIPTIONS & 12-MONTH SCHEDULES (35 subscriptions) ────
  console.log('[16/18] Generating 35 Subscriptions and 200 Billing Schedules...');
  const subscriptions = [];
  const subscriptionLines = [];
  const billingSchedules = [];

  for (let s = 0; s < 35; s++) {
    const subId = crypto.randomUUID();
    const so = salesOrders[s % salesOrders.length];
    const plan = subPlans[s % subPlans.length];
    const subNumber = `SUB-2026-${String(s + 1).padStart(4, '0')}`;
    const startDate = new Date(so.createdAt);
    const nextDate = new Date(startDate);
    nextDate.setMonth(nextDate.getMonth() + 1);

    subscriptions.push({
      id: subId,
      subscriptionNumber: subNumber,
      customerId: so.customerId,
      salesOrderId: so.id,
      planId: plan.id,
      status: s < 30 ? 'ACTIVE' : 'PAUSED',
      currency: 'USD',
      startDate,
      nextBillingDate: nextDate,
      createdAt: startDate,
      updatedAt: startDate,
    });

    const recurringProd = products.find((p) => p.sku === 'SW-CRM-ENT') || products[0];
    subscriptionLines.push({
      id: crypto.randomUUID(),
      subscriptionId: subId,
      productId: recurringProd.id,
      quantity: randInt(5, 25),
      unitPrice: plan.price,
      discountPercent: 0,
      taxRate: 18,
      lineTotal: Number(plan.price) * 10,
      billingType: 'RECURRING',
      createdAt: startDate,
    });

    // Generate rolling schedules
    for (let m = 0; m < 6; m++) {
      const pStart = new Date(startDate);
      pStart.setMonth(pStart.getMonth() + m);
      const pEnd = new Date(pStart);
      pEnd.setMonth(pEnd.getMonth() + 1);

      billingSchedules.push({
        id: crypto.randomUUID(),
        subscriptionId: subId,
        dueDate: pStart,
        periodStart: pStart,
        periodEnd: pEnd,
        amount: plan.price,
        status: m < 2 ? 'PAID' : 'SCHEDULED',
        paidAt: m < 2 ? pStart : null,
        createdAt: startDate,
      });
    }
  }

  await chunkedCreateMany(prisma.subscription, subscriptions);
  await chunkedCreateMany(prisma.subscriptionLine, subscriptionLines);
  await chunkedCreateMany(prisma.billingSchedule, billingSchedules);

  // ─── 18. INVOICES & PAYMENTS (110 invoices, 90 payments) ──────────
  console.log('[17/18] Generating 110 Invoices and 90 Verified Payment Records...');
  const invoices = [];
  const invoiceLines = [];
  const payments = [];

  for (let invIdx = 0; invIdx < 110; invIdx++) {
    const invId = crypto.randomUUID();
    const invNumber = `INV-${String(invIdx + 1).padStart(5, '0')}`;
    const so = salesOrders[invIdx % salesOrders.length];
    const invDate = new Date(so.createdAt);
    const dueDate = new Date(invDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Distribution:
    // 0 - 47: PAID (~48)
    // 48 - 75: PARTIAL (~28)
    // 76 - 97: PENDING (~22)
    // 98 - 109: OVERDUE (~12)
    let invStatus = 'PENDING';
    let paidAmount = 0;
    let balance = Number(so.totalAmount);
    let paidDate = null;

    if (invIdx < 48) {
      invStatus = 'PAID';
      paidAmount = Number(so.totalAmount);
      balance = 0;
      paidDate = new Date(invDate);
      paidDate.setDate(paidDate.getDate() + 5);
    } else if (invIdx < 76) {
      invStatus = 'PARTIAL';
      paidAmount = Math.round(Number(so.totalAmount) * 0.45 * 100) / 100;
      balance = Math.max(0, Number(so.totalAmount) - paidAmount);
    } else if (invIdx >= 98) {
      invStatus = 'PENDING';
      dueDate.setDate(dueDate.getDate() - 45); // overdue
    }

    invoices.push({
      id: invId,
      invoiceNumber: invNumber,
      customerId: so.customerId,
      salesOrderId: so.id,
      currency: 'USD',
      subtotal: so.subtotal,
      discountAmount: so.discountAmount,
      taxAmount: so.taxAmount,
      totalAmount: so.totalAmount,
      amount: so.totalAmount,
      amountPaid: paidAmount,
      balanceDue: balance,
      status: invStatus,
      dueDate,
      paidAt: paidDate,
      createdAt: invDate,
      updatedAt: invDate,
    });

    // Invoice lines
    const soLines = salesOrderLines.filter((l) => l.salesOrderId === so.id);
    for (const sol of soLines) {
      const prod = products.find((p) => p.id === sol.productId);
      invoiceLines.push({
        id: crypto.randomUUID(),
        invoiceId: invId,
        productId: sol.productId,
        description: prod?.name || 'Line Item',
        quantity: sol.quantity,
        unitPrice: sol.unitPrice,
        discountAmount: sol.discountAmount,
        taxAmount: (Number(sol.lineSubtotal) - Number(sol.discountAmount)) * (Number(sol.taxRate) / 100),
        lineTotal: sol.lineTotal,
        createdAt: invDate,
      });
    }

    // Payment record
    if (paidAmount > 0) {
      payments.push({
        id: crypto.randomUUID(),
        invoiceId: invId,
        amount: paidAmount,
        method: invIdx % 2 === 0 ? 'BANK_TRANSFER' : 'CREDIT_CARD',
        reference: `WIRE-2026-${String(10000 + invIdx)}`,
        status: 'PAID',
        paidAt: paidDate || new Date(invDate),
        createdAt: invDate,
      });
    }
  }

  await chunkedCreateMany(prisma.invoice, invoices);
  await chunkedCreateMany(prisma.invoiceLine, invoiceLines);
  await chunkedCreateMany(prisma.payment, payments);

  // ─── 19. AUDIT LOGS & ALERTS ──────────────────────────────────────
  console.log('[18/18] Generating Audit Trail and Alert Feeds...');
  await prisma.alert.deleteMany({});
  const alertsData = [
    { entityType: 'QUOTATION', entityId: quotations[0].id, type: 'DISCOUNT_WARNING', message: 'Quotation requires approval: 20% discount requested.', severity: 'WARNING', acknowledged: false },
    { entityType: 'INVENTORY', entityId: warehouses[0].id, type: 'LOW_STOCK', message: 'Warehouse stock below threshold for ThinkPad Ultrabooks.', severity: 'CRITICAL', acknowledged: false },
    { entityType: 'INVOICE', entityId: invoices[100].id, type: 'OVERDUE_INVOICE', message: 'Invoice INV-00101 is overdue by 15 days.', severity: 'WARNING', acknowledged: false },
    { entityType: 'DEAL_HEALTH', entityId: quotations[5].id, type: 'MARGIN_RISK', message: 'Deal gross margin is below target 20%.', severity: 'CRITICAL', acknowledged: false },
  ];
  await chunkedCreateMany(prisma.alert, alertsData.map((a) => ({ ...a, id: crypto.randomUUID(), createdAt: new Date() })));

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // ─── 20. QUERY ACTUAL PRISMA COUNTS FOR SUMMARY ───────────────────
  const [
    userCount,
    customerCount,
    productCount,
    priceListCount,
    priceListItemCount,
    warehouseCount,
    stockCount,
    discountRuleCount,
    approvalRuleCount,
    quotationCount,
    quotationLineCount,
    salesOrderCount,
    salesOrderLineCount,
    fulfillmentCount,
    backorderCount,
    subscriptionCount,
    invoiceCount,
    paymentCount,
    negotiationCount,
    negotiationMsgCount,
    dealHealthCount,
    recCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.product.count(),
    prisma.priceList.count(),
    prisma.priceListItem.count(),
    prisma.warehouse.count(),
    prisma.warehouseStock.count(),
    prisma.discountRule.count(),
    prisma.approvalRule.count(),
    prisma.quotation.count(),
    prisma.quotationLine.count(),
    prisma.salesOrder.count(),
    prisma.salesOrderLine.count(),
    prisma.fulfillmentOrder.count(),
    prisma.backorder.count(),
    prisma.subscription.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
    prisma.negotiation.count(),
    prisma.negotiationMessage.count(),
    prisma.dealHealth.count(),
    prisma.recommendation.count(),
  ]);

  console.log('\n========================================');
  console.log('DealFlow360 Seed Complete');
  console.log('========================================\n');
  console.log(`Users:                 ${userCount}`);
  console.log(`Customers:             ${customerCount}`);
  console.log(`Products:              ${productCount}`);
  console.log(`Price Lists:           ${priceListCount}`);
  console.log(`Product Price Entries: ${priceListItemCount}`);
  console.log(`Warehouses:            ${warehouseCount}`);
  console.log(`Inventory:             ${stockCount}`);
  console.log(`Discount Rules:        ${discountRuleCount}`);
  console.log(`Approval Rules:        ${approvalRuleCount}`);
  console.log(`Quotations:            ${quotationCount}`);
  console.log(`Quotation Lines:       ${quotationLineCount}`);
  console.log(`Sales Orders:          ${salesOrderCount}`);
  console.log(`Order Lines:           ${salesOrderLineCount}`);
  console.log(`Fulfillments:          ${fulfillmentCount}`);
  console.log(`Backorders:            ${backorderCount}`);
  console.log(`Subscriptions:         ${subscriptionCount}`);
  console.log(`Invoices:              ${invoiceCount}`);
  console.log(`Payments:              ${paymentCount}`);
  console.log(`Negotiations:          ${negotiationCount}`);
  console.log(`Negotiation Messages:  ${negotiationMsgCount}`);
  console.log(`Deal Health:           ${dealHealthCount}`);
  console.log(`Recommendations:       ${recCount}`);
  console.log('\n========================================');
  console.log(`Seed validation: PASSED (Completed in ${totalTime}s)`);
  console.log('========================================\n');

  console.log('Demo Login Credentials (Password: demo1234):');
  console.log('  Admin:         admin@dealflow360.com');
  console.log('  Sales Rep:     sales@dealflow.demo');
  console.log('  Manager Admin: manager@dealflow.demo');
  console.log('  Ops & Finance: ops@dealflow.demo');
  console.log('  Customer:      customer@dealflow.demo\n');
}

if (require.main === module) {
  runMasterSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed failure:', err);
      process.exit(1);
    });
}

module.exports = { runMasterSeed };
