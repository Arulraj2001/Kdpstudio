import { Timestamp } from 'firebase/firestore';

export type PlanName = 'free' | 'starter' | 'pro' | 'agency' | 'lifetime';
export type BillingCycle = 'monthly' | 'annual' | 'lifetime';
export type PaymentGateway = 'stripe' | 'upi' | 'bmac';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type Currency = 'INR' | 'USD' | 'GBP' | 'EUR' | 'CAD' | 'AUD';

/**
 * Completed or attempted payment transaction in /payments/{paymentId}
 */
export interface PaymentRecord {
  id: string;
  uid: string;
  email: string;
  gateway: PaymentGateway;
  gatewayPaymentId: string; // ID from Stripe / UPI / BMAC
  gatewaySubscriptionId: string | null;
  gatewayCustomerId: string | null;
  plan: PlanName;
  billingCycle: BillingCycle;
  amount: number; // in lowest denomination (paise for INR, cents for USD/EUR/etc)
  currency: Currency;
  status: PaymentStatus;
  createdAt: Timestamp | string | any;
  updatedAt: Timestamp | string | any;
  planStartDate: Timestamp | string | any;
  planEndDate: Timestamp | string | any | null;
  metadata: Record<string, any>; // gateway-specific payload
}

/**
 * Active recurring subscription record in /subscriptions/{subId}
 */
export interface SubscriptionRecord {
  id: string;
  uid: string;
  gateway: PaymentGateway;
  gatewaySubscriptionId: string;
  plan: PlanName;
  billingCycle: BillingCycle;
  status: 'active' | 'cancelled' | 'paused' | 'past_due' | 'expired';
  currentPeriodStart: Timestamp | string | any;
  currentPeriodEnd: Timestamp | string | any;
  cancelAtPeriodEnd: boolean;
  currency: Currency;
  amount: number;
  createdAt: Timestamp | string | any;
  updatedAt: Timestamp | string | any;
}

/**
 * Manual UPI transaction waiting for verification in /upiPending/{pendingId}
 */
export interface UpiPendingPayment {
  id: string;
  uid: string;
  email: string;
  name: string;
  plan: PlanName;
  billingCycle: BillingCycle;
  amount: number;
  utrNumber: string; // UTR transaction reference number
  screenshotUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp | string | any;
  reviewedAt: Timestamp | string | any | null;
  reviewedBy: string | null;
  notes: string | null;
}

/**
 * Client checkout session context
 */
export interface CheckoutSession {
  plan: PlanName;
  billingCycle: BillingCycle;
  currency: Currency;
  gateway: PaymentGateway;
  amount: number;
  uid: string;
  email: string;
  name: string;
}
