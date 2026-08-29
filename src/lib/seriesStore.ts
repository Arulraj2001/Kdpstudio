/**
 * Zustand Store for Book Series Manager
 * Phase 12B — KDP Studio
 */

import { create } from 'zustand';
import { BookSeries, SeriesVolume } from '../types/series';
import * as seriesService from './seriesService';
import { useToastStore } from './toastStore';

interface SeriesState {
  seriesList: BookSeries[];
  currentSeries: BookSeries | null;
  volumes: SeriesVolume[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  loadUserSeries: (uid: string) => Promise<void>;
  selectSeries: (seriesId: string) => Promise<void>;
  clearCurrentSeries: () => void;
  createSeries: (
    uid: string,
    data: Omit<BookSeries, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateSeries: (seriesId: string, data: Partial<BookSeries>) => Promise<void>;
  deleteSeries: (seriesId: string) => Promise<void>;
  addBookToSeries: (
    seriesId: string,
    bookId: string,
    volumeNumber: number
  ) => Promise<void>;
  removeBookFromSeries: (seriesId: string, bookId: string) => Promise<void>;
  reorderBooks: (seriesId: string, newOrder: string[]) => Promise<void>;
  refreshVolumes: (seriesId: string) => Promise<void>;
}

export const useSeriesStore = create<SeriesState>((set, get) => ({
  seriesList: [],
  currentSeries: null,
  volumes: [],
  isLoading: false,
  isSaving: false,
  error: null,

  loadUserSeries: async (uid: string) => {
    if (!uid) return;
    set({ isLoading: true, error: null });
    try {
      const list = await seriesService.getUserSeries(uid);
      set({ seriesList: list, isLoading: false });
    } catch (err: any) {
      console.error('Failed to load user series:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  selectSeries: async (seriesId: string) => {
    if (!seriesId) {
      set({ currentSeries: null, volumes: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const s = await seriesService.getSeries(seriesId);
      const vols = await seriesService.getSeriesVolumes(seriesId);
      set({ currentSeries: s, volumes: vols, isLoading: false });
    } catch (err: any) {
      console.error('Failed to get series:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  clearCurrentSeries: () => {
    set({ currentSeries: null, volumes: [] });
  },

  createSeries: async (uid, data) => {
    set({ isSaving: true, error: null });
    try {
      const seriesId = await seriesService.createSeries(uid, data);
      const created = await seriesService.getSeries(seriesId);
      if (created) {
        set((state) => ({
          seriesList: [created, ...state.seriesList],
          currentSeries: created,
          isSaving: false,
        }));
      }
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Series Created',
        message: `"${data.title}" has been created successfully.`,
      });
      return seriesId;
    } catch (err: any) {
      console.error('Failed to create series:', err);
      set({ isSaving: false, error: err.message });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create series.',
      });
      throw err;
    }
  },

  updateSeries: async (seriesId, data) => {
    set({ isSaving: true, error: null });
    try {
      await seriesService.updateSeries(seriesId, data);
      const updated = await seriesService.getSeries(seriesId);
      const vols = await seriesService.getSeriesVolumes(seriesId);
      set((state) => ({
        seriesList: state.seriesList.map((s) => (s.id === seriesId && updated ? updated : s)),
        currentSeries: updated || state.currentSeries,
        volumes: vols,
        isSaving: false,
      }));
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Series Updated',
        message: 'Series preferences have been saved.',
      });
    } catch (err: any) {
      console.error('Failed to update series:', err);
      set({ isSaving: false, error: err.message });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update series.',
      });
      throw err;
    }
  },

  deleteSeries: async (seriesId) => {
    set({ isSaving: true, error: null });
    try {
      await seriesService.deleteSeries(seriesId);
      set((state) => ({
        seriesList: state.seriesList.filter((s) => s.id !== seriesId),
        currentSeries: state.currentSeries?.id === seriesId ? null : state.currentSeries,
        volumes: state.currentSeries?.id === seriesId ? [] : state.volumes,
        isSaving: false,
      }));
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Series Deleted',
        message: 'The series was removed. Your books remain in My Books.',
      });
    } catch (err: any) {
      console.error('Failed to delete series:', err);
      set({ isSaving: false, error: err.message });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Could not delete series.',
      });
      throw err;
    }
  },

  addBookToSeries: async (seriesId, bookId, volumeNumber) => {
    try {
      await seriesService.addBookToSeries(seriesId, bookId, volumeNumber);
      await get().selectSeries(seriesId);
    } catch (err: any) {
      console.error('Failed to add book to series:', err);
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not link book to series.',
      });
    }
  },

  removeBookFromSeries: async (seriesId, bookId) => {
    try {
      await seriesService.removeBookFromSeries(seriesId, bookId);
      await get().selectSeries(seriesId);
    } catch (err: any) {
      console.error('Failed to remove book from series:', err);
    }
  },

  reorderBooks: async (seriesId, newOrder) => {
    try {
      await seriesService.reorderSeriesBooks(seriesId, newOrder);
      await get().selectSeries(seriesId);
    } catch (err: any) {
      console.error('Failed to reorder books:', err);
    }
  },

  refreshVolumes: async (seriesId) => {
    try {
      const vols = await seriesService.getSeriesVolumes(seriesId);
      set({ volumes: vols });
    } catch (err) {
      console.error('Failed to refresh volumes:', err);
    }
  },
}));
