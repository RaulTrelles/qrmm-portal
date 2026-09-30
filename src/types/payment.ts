export type PlanTier = "STARTER" | "PRO" | "ENTERPRISE";
export type CurrencyCode = "PEN" | "USD" | "EUR" | "MXN";
export type PaymentGateway = "CARD" | "STRIPE" | "YAPE" | "PLIN" | "BIZUM" | "MERCADOPAGO";

export interface Transaction {
  id: string;
  transaction_ref: string;
  organization_id?: string;
  organization_name?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  amount: number;
  currency: string;
  plan_tier: string;
  billing_cycle: string;
  gateway: string;
  card_brand?: string;
  card_last4?: string;
  promo_code?: string;
  status: string;
  created_at: string;
}

export interface PaymentStats {
  total_revenue_usd: number;
  total_transactions: number;
  active_subscriptions: number;
  pro_count: number;
  enterprise_count: number;
}

export interface OnlineUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization_id?: string;
  organization_name?: string;
  avatar_url?: string;
  last_active_at?: string;
  last_ip?: string;
  last_user_agent?: string;
  is_online: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  auth_provider: string;
  organization_id?: string;
  organization_name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_online: boolean;
  last_active_at?: string;
  last_ip?: string;
  last_user_agent?: string;
  created_at: string;
}

export interface CheckoutPayload {
  full_name: string;
  email: string;
  password: string;
  organization_name: string;
  plan_tier: string;
  billing_cycle: string;
  currency: string;
  amount: number;
  gateway: string;
  card_number?: string;
  card_exp?: string;
  card_cvv?: string;
  card_holder?: string;
  promo_code?: string;
}

export interface CheckoutResponse {
  success: boolean;
  transaction_ref: string;
  message: string;
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    organization_id?: string;
    auth_provider: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    enrollment_token?: string;
  };
}
