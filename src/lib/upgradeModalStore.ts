import { create } from 'zustand';
import { PlanTier } from './planLimits';

export interface UpgradeModalConfig {
  trigger: 'limit_reached' | 'feature_locked';
  feature?: string;
  requiredPlan?: PlanTier | string;
  usageInfo?: {
    current?: number;
    limit?: number;
    resetTime?: string;
  };
}

interface UpgradeModalStore {
  isOpen: boolean;
  config: UpgradeModalConfig;
  open: (config: UpgradeModalConfig) => void;
  close: () => void;
}

export const useUpgradeModal = create<UpgradeModalStore>((set) => ({
  isOpen: false,
  config: {
    trigger: 'limit_reached',
    feature: 'AI Generations',
    requiredPlan: 'starter',
  },
  open: (config) => set({ isOpen: true, config }),
  close: () => set({ isOpen: false }),
}));
