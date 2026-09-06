import { useState } from 'react';
import { UserCheck, ShieldCheck, Truck, Users, Settings, ArrowRight } from 'lucide-react';

const ROLES = [
  {
    id: 'sales',
    label: 'Sales Rep',
    icon: UserCheck,
    title: 'Sales Representative',
    description:
      'Quickly build multi-item quotations with automated discount validation, live margin feedback, catalog cross-sell suggestions, and direct customer negotiation.',
    capabilities: [
      'Interactive Quote Builder with margin preview',
      'Instant discount limit check & pre-submission risk scoring',
      'Real-time customer negotiation thread',
      'Catalog recommendations to increase deal size',
    ],
  },
  {
    id: 'manager',
    label: 'Sales Manager',
    icon: ShieldCheck,
    title: 'Sales Manager',
    description:
      'Keep deals moving with high-velocity approval queues, discount anomaly detection, deal health tracking, and team quota monitoring.',
    capabilities: [
      'Centralized pending approval queue with one-click sign-off',
      'Deal Health analytics and stalled-deal detection',
      'Custom discount rule and margin tier administration',
      'Audit logging for all price concessions',
    ],
  },
  {
    id: 'ops',
    label: 'Finance & Operations',
    icon: Truck,
    title: 'Finance & Operations Team',
    description:
      'Bridge the gap between closed deals and revenue realization. Manage warehouse stock allocations, backorders, invoices, payments, and subscriptions.',
    capabilities: [
      'Multi-warehouse automated allocation and manual re-routing',
      'Hybrid invoicing for one-time capital goods + subscriptions',
      'Live backorder tracking and stock reservation',
      'Automated recurring billing cycles and payment matching',
    ],
  },
  {
    id: 'customer',
    label: 'Client / Buyer',
    icon: Users,
    title: 'Customer Portal User',
    description:
      'Provide corporate buyers with a self-service workspace to review quotations, propose counter-discounts, communicate with reps, and accept quotes.',
    capabilities: [
      'Clear breakdown of quotation terms and delivery schedules',
      'Real-time inquiry and counter-discount submission',
      'One-click digital quotation confirmation',
      'Self-service invoice history and recurring subscription hub',
    ],
  },
  {
    id: 'admin',
    label: 'Executive Admin',
    icon: Settings,
    title: 'Executive & System Administrator',
    description:
      'Govern the full enterprise platform. Manage product catalogs, customer pricing tiers, warehouses, user access levels, and executive reports.',
    capabilities: [
      'Comprehensive product, warehouse, and pricebook control',
      'Role-based access control (RBAC) across all 5 user personas',
      'Executive sales performance and margin analytics',
      'Knowledge base management for the AI assistant',
    ],
  },
];

export default function RoleSection() {
  const [activeTab, setActiveTab] = useState<string>('sales-rep');
  const activeRole = ROLES.find((r) => r.id === activeTab) || ROLES[0]!;

  return (
    <section className="py-20 md:py-28 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Role-Based Workspaces
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            One platform. Every team.
          </h2>
          <p className="text-sm text-muted-foreground">
            Dedicated portals configured for each stakeholder across the B2B sales lifecycle.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isActive = r.id === activeTab;
            return (
              <button
                key={r.id}
                onClick={() => setActiveTab(r.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-foreground text-background shadow-xs'
                    : 'border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Active Role Content Card */}
        <div className="max-w-4xl mx-auto rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dedicated Portal Workspace
              </span>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{activeRole.title}</h3>
            </div>
            <span className="inline-flex items-center rounded-md border border-border/60 bg-background px-3 py-1 text-xs font-mono text-foreground">
              Role: {activeRole.id.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {activeRole.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {activeRole.capabilities.map((cap, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border/40 bg-background/50 p-3 text-xs flex items-center gap-2 text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
