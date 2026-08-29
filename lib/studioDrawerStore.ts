/**
 * KDP Studio — Studio Drawer Zustand Store
 * Controls mutual exclusion between Version History and Content Audit drawers
 * Phase 16C
 */

import { create } from 'zustand';

export type StudioDrawerType = 'history' | 'audit' | null;

interface StudioDrawerState {
  activeDrawer: StudioDrawerType;
  openDrawer: (drawer: 'history' | 'audit') => void;
  closeDrawer: () => void;
  toggleDrawer: (drawer: 'history' | 'audit') => void;
}

export const useStudioDrawerStore = create<StudioDrawerState>((set) => ({
  activeDrawer: null,
  openDrawer: (drawer) => set({ activeDrawer: drawer }),
  closeDrawer: () => set({ activeDrawer: null }),
  toggleDrawer: (drawer) =>
    set((state) => ({
      activeDrawer: state.activeDrawer === drawer ? null : drawer,
    })),
}));
