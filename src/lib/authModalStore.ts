import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface AuthModalConfig {
  title?: string;
  description?: string;
  view?: 'login' | 'signup' | 'forgot-password';
  onSuccess?: () => void;
}

interface AuthModalState {
  isOpen: boolean;
  view: 'login' | 'signup' | 'forgot-password';
  title?: string;
  description?: string;
  pendingAction?: () => void;

  open: (config?: AuthModalConfig) => void;
  close: () => void;
  setView: (view: 'login' | 'signup' | 'forgot-password') => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  view: 'signup',
  title: undefined,
  description: undefined,
  pendingAction: undefined,

  open: (config) => {
    set({
      isOpen: true,
      view: config?.view || 'signup',
      title: config?.title,
      description: config?.description,
      pendingAction: config?.onSuccess,
    });
  },

  close: () => {
    set({
      isOpen: false,
      title: undefined,
      description: undefined,
      pendingAction: undefined,
    });
  },

  setView: (view) => set({ view }),
}));

/**
 * Ensures user is authenticated before executing the specified action.
 * If authenticated, runs `action()` immediately.
 * If unauthenticated, opens the AuthModal and stores `action` to run upon success.
 */
export function requireAuth(
  action: () => void,
  config?: { title?: string; description?: string; view?: 'login' | 'signup' }
): void {
  const { user } = useAuthStore.getState();

  if (user) {
    action();
  } else {
    useAuthModalStore.getState().open({
      title: config?.title || 'Sign In to Continue',
      description: config?.description || 'Please create a free account or sign in to save your manuscripts, access AI tools, and export print-ready books.',
      view: config?.view || 'signup',
      onSuccess: action,
    });
  }
}
