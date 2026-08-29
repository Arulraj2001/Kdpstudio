import { create } from 'zustand';
import { BrandKit, DEFAULT_BRAND_KIT, PenName } from '../types/brand';
import { getBrandKit, saveBrandKit } from './brandService';

interface BrandStoreState {
  brandKit: BrandKit | null;
  savedSnapshot: BrandKit | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  loadBrandKit: (uid: string) => Promise<void>;
  updateField: <K extends keyof BrandKit>(field: K, value: BrandKit[K]) => void;
  updateFields: (fields: Partial<BrandKit>) => void;
  saveChanges: (uid: string) => Promise<void>;
  resetToSaved: () => void;
  addPenName: (penName: PenName) => void;
  removePenName: (name: string) => void;
  setActivePenName: (name: string) => void;
}

export const useBrandStore = create<BrandStoreState>((set, get) => ({
  brandKit: null,
  savedSnapshot: null,
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,

  loadBrandKit: async (uid: string) => {
    if (!uid) return;
    set({ isLoading: true });
    try {
      let kit = await getBrandKit(uid);
      if (!kit) {
        kit = {
          ...DEFAULT_BRAND_KIT,
          uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      set({
        brandKit: kit,
        savedSnapshot: JSON.parse(JSON.stringify(kit)),
        isLoading: false,
        hasUnsavedChanges: false,
      });
    } catch (err) {
      console.warn('Error loading Brand Kit into store:', err);
      set({ isLoading: false });
    }
  },

  updateField: (field, value) => {
    const current = get().brandKit;
    if (!current) return;

    const updated = {
      ...current,
      [field]: value,
    };

    set({
      brandKit: updated,
      hasUnsavedChanges: true,
    });
  },

  updateFields: (fields) => {
    const current = get().brandKit;
    if (!current) return;

    const updated = {
      ...current,
      ...fields,
    };

    set({
      brandKit: updated,
      hasUnsavedChanges: true,
    });
  },

  saveChanges: async (uid: string) => {
    const current = get().brandKit;
    if (!current || !uid) return;

    set({ isSaving: true });
    try {
      await saveBrandKit(uid, current);
      set({
        savedSnapshot: JSON.parse(JSON.stringify(current)),
        isSaving: false,
        hasUnsavedChanges: false,
      });
    } catch (err) {
      console.error('Error saving Brand Kit:', err);
      set({ isSaving: false });
      throw err;
    }
  },

  resetToSaved: () => {
    const snapshot = get().savedSnapshot;
    if (snapshot) {
      set({
        brandKit: JSON.parse(JSON.stringify(snapshot)),
        hasUnsavedChanges: false,
      });
    }
  },

  addPenName: (penName: PenName) => {
    const current = get().brandKit;
    if (!current) return;

    const existing = current.penNames || [];
    if (existing.length >= 5) {
      alert('Maximum 5 pen names allowed per brand kit.');
      return;
    }

    if (existing.some((p) => p.name.toLowerCase() === penName.name.toLowerCase())) {
      alert('A pen name with this name already exists.');
      return;
    }

    const updatedPenNames = [...existing, penName];
    set({
      brandKit: {
        ...current,
        penNames: updatedPenNames,
      },
      hasUnsavedChanges: true,
    });
  },

  removePenName: (name: string) => {
    const current = get().brandKit;
    if (!current) return;

    const updatedPenNames = (current.penNames || []).filter((p) => p.name !== name);
    let active = current.activePenName;
    if (active === name) {
      active = current.authorName || '';
    }

    set({
      brandKit: {
        ...current,
        penNames: updatedPenNames,
        activePenName: active,
      },
      hasUnsavedChanges: true,
    });
  },

  setActivePenName: (name: string) => {
    const current = get().brandKit;
    if (!current) return;

    set({
      brandKit: {
        ...current,
        activePenName: name,
      },
      hasUnsavedChanges: true,
    });
  },
}));
