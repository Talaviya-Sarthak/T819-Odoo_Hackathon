export type Role = 'ADMIN' | 'SALES_REP' | 'SALES_MANAGER' | 'FINANCE' | 'OPERATIONS' | 'CUSTOMER' | 'MANAGER_ADMIN' | 'OPS_FINANCE';

export type CustomerTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type QuotationStatus = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'NEGOTIATION'
  | 'CUSTOMER_CONFIRMED'
  | 'ORDER_CONFIRMED'
  | 'FULFILLMENT'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'REJECTED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'SENT'
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';

export type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'PARTIAL' | 'REFUNDED';

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'PAST_DUE';

export type NegotiationStatus = 'OPEN' | 'CLOSED' | 'WON' | 'LOST';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  customer_id?: string;
  status?: string;
  avatar_url?: string;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NavItem {
  id?: string;
  name: string;
  label: string;
  path: string;
  icon: string;
}

export interface PortalInfo {
  name: string;
  route: string;
}

export interface RoleOption {
  id: string;
  name: string;
  displayName?: string;
  display_name?: string;
  description?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  portal: PortalInfo | null;
  navigation: NavItem[];
  permissions: string[];
  login: (accessToken: string, refreshToken: string, userData: User, portal?: PortalInfo | null, navigation?: NavItem[], permissions?: string[]) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  handleRefreshToken: () => Promise<string | null>;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  portal?: PortalInfo | null;
  navigation?: NavItem[];
  permissions?: string[];
  message?: string;
}

export interface RegisterResponse {
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  portal?: PortalInfo | null;
  navigation?: NavItem[];
  permissions?: string[];
}

export interface VerifyEmailResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  portal?: PortalInfo | null;
  navigation?: NavItem[];
  permissions?: string[];
}

export interface ApiError {
  error: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export interface OAuthButtonProps {
  provider: 'google' | 'github';
  onClick: () => void;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

// ─── Product ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id: string;
  base_price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price_modifier: number;
  attributes?: Record<string, string>;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

// ─── Customer ───────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tier: CustomerTier;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

// ─── Quotation ──────────────────────────────────────────────────────────────

export interface QuotationLine {
  id: string;
  product_id: string;
  product_name?: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
  notes?: string;
}

export interface Quotation {
  id: string;
  quotation_number?: string;
  customer_id: string;
  customer_name?: string;
  sales_rep_id: string;
  sales_rep_name?: string;
  status: QuotationStatus;
  lines: QuotationLine[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  currency: string;
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Approval ───────────────────────────────────────────────────────────────

export interface ApprovalRequest {
  id: string;
  quotation_id: string;
  quotation_number?: string;
  requested_by: string;
  requested_by_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  status: ApprovalStatus;
  reason: string;
  discount_percent?: number;
  manager_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalHistory {
  id: string;
  approval_request_id: string;
  action: string;
  performed_by: string;
  performed_by_name?: string;
  notes?: string;
  created_at: string;
}

// ─── Fulfillment ────────────────────────────────────────────────────────────

export interface FulfillmentLine {
  id: string;
  fulfillment_order_id: string;
  quotation_line_id: string;
  product_name?: string;
  quantity_requested: number;
  quantity_allocated: number;
  warehouse_id?: string;
  warehouse_name?: string;
}

export interface FulfillmentOrder {
  id: string;
  quotation_id: string;
  status: FulfillmentStatus;
  lines: FulfillmentLine[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Backorder ──────────────────────────────────────────────────────────────

export interface Backorder {
  id: string;
  fulfillment_line_id: string;
  product_name?: string;
  quantity_backordered: number;
  expected_date?: string;
  status: string;
  created_at: string;
}

// ─── Subscription ───────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
  base_price: number;
}

export interface SubscriptionLine {
  id: string;
  subscription_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
}

export interface Subscription {
  id: string;
  customer_id: string;
  customer_name?: string;
  plan_id: string;
  plan_name?: string;
  status: SubscriptionStatus;
  lines: SubscriptionLine[];
  start_date: string;
  next_billing_date?: string;
  created_at: string;
  updated_at: string;
}

// ─── Billing ────────────────────────────────────────────────────────────────

export interface BillingSchedule {
  id: string;
  subscription_id: string;
  invoice_date: string;
  amount: number;
  status: string;
  invoice_id?: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  customer_name?: string;
  quotation_id?: string;
  subscription_id?: string;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  invoice_number?: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  reference?: string;
  paid_at?: string;
  created_at: string;
}

// ─── Negotiation ────────────────────────────────────────────────────────────

export interface NegotiationMessage {
  id: string;
  negotiation_id: string;
  sender_id: string;
  sender_name?: string;
  message: string;
  attachment_url?: string;
  created_at: string;
}

export interface Negotiation {
  id: string;
  quotation_id: string;
  customer_id: string;
  status: NegotiationStatus;
  messages: NegotiationMessage[];
  created_at: string;
  updated_at: string;
}

// ─── Recommendation ─────────────────────────────────────────────────────────

export interface Recommendation {
  id: string;
  quotation_id: string;
  product_id: string;
  product_name?: string;
  reason: string;
  confidence: number;
  is_accepted: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface UpsellRule {
  id: string;
  trigger_product_id: string;
  recommended_product_id: string;
  discount_percent: number;
  is_active: boolean;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DealHealth {
  total_deals: number;
  active_deals: number;
  won_deals: number;
  lost_deals: number;
  total_revenue: number;
  average_deal_size: number;
  win_rate: number;
  pipeline_value: number;
}

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

// ─── Warehouse ──────────────────────────────────────────────────────────────

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  capacity?: number;
  is_active: boolean;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  warehouse_name?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

// ─── Reports ────────────────────────────────────────────────────────────────

export interface ReportParams {
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
}

export interface SalesReport {
  period: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_products: { product_name: string; revenue: number; quantity: number }[];
}

export interface ApprovalReport {
  period: string;
  total_requests: number;
  approved: number;
  rejected: number;
  returned: number;
  average_processing_time: number;
}

export interface FulfillmentReport {
  period: string;
  total_orders: number;
  fulfilled: number;
  pending: number;
  backordered: number;
  average_fulfillment_time: number;
}

export interface BillingReport {
  period: string;
  total_invoiced: number;
  total_collected: number;
  outstanding: number;
  overdue: number;
  collection_rate: number;
}
