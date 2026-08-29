import { create } from 'zustand';
import { PlanName, BillingCycle } from '../types/payment';

export interface CheckoutStore {
  isOpen: boolean;
  defaultPlan: PlanName | null;
  defaultBillingCycle: BillingCycle;
  open: (plan?: PlanName, cycle?: BillingCycle) => void;
  close: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  isOpen: false,
  defaultPlan: 'pro',
  defaultBillingCycle: 'monthly',
  open: (plan, cycle) =>
    set({
      isOpen: true,
      defaultPlan: plan || 'pro',
      defaultBillingCycle: cycle || 'monthly',
    }),
  close: () => set({ isOpen: false }),
}));

/**
 * Convenient procedural interface to open/close checkout without hooks
 */
export const checkoutStore = {
  open: (plan?: PlanName, cycle?: BillingCycle) => useCheckoutStore.getState().open(plan, cycle),
  close: () => useCheckoutStore.getState().close(),
};
