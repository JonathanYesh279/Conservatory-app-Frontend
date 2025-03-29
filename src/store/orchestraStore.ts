// src/store/orchestraStore.ts
import { create } from 'zustand';
import {
  Orchestra,
  OrchestraFilter,
  orchestraService,
} from '../services/orchestraService';

interface OrchestraState {
  orchestras: Orchestra[];
  selectedOrchestra: Orchestra | null;
  filterBy: OrchestraFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadOrchestras: (filterBy?: OrchestraFilter) => Promise<void>;
  loadOrchestraById: (orchestraId: string) => Promise<void>;
  saveOrchestra: (orchestra: Partial<Orchestra>) => Promise<Orchestra>;
  removeOrchestra: (orchestraId: string) => Promise<void>;
  setFilter: (filterBy: Partial<OrchestraFilter>) => void;
  clearSelectedOrchestra: () => void;
  clearError: () => void;
}

export const useOrchestraStore = create<OrchestraState>((set, get) => ({
  orchestras: [],
  selectedOrchestra: null,
  filterBy: {},
  isLoading: false,
  error: null,

  loadOrchestras: async (filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const newFilterBy = { ...get().filterBy, ...filterBy };
      const orchestras = await orchestraService.getOrchestras(newFilterBy);
      set({ orchestras, filterBy: newFilterBy, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load orchestras';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading orchestras:', err);
    }
  },

  loadOrchestraById: async (orchestraId) => {
    set({ isLoading: true, error: null });
    try {
      const orchestra = await orchestraService.getOrchestraById(orchestraId);
      set({ selectedOrchestra: orchestra, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load orchestra';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading orchestra:', err);
    }
  },

  saveOrchestra: async (orchestraToSave) => {
    set({ isLoading: true, error: null });
    try {
      let savedOrchestra: Orchestra;

      if (orchestraToSave._id) {
        // Update existing orchestra
        savedOrchestra = await orchestraService.updateOrchestra(
          orchestraToSave._id,
          orchestraToSave
        );

        // Update in the orchestras array
        const updatedOrchestras = get().orchestras.map((o) =>
          o._id === savedOrchestra._id ? savedOrchestra : o
        );

        set({
          orchestras: updatedOrchestras,
          selectedOrchestra: savedOrchestra,
          isLoading: false,
        });
      } else {
        // Add new orchestra
        savedOrchestra = await orchestraService.addOrchestra(orchestraToSave);

        set({
          orchestras: [...get().orchestras, savedOrchestra],
          selectedOrchestra: savedOrchestra,
          isLoading: false,
        });
      }

      return savedOrchestra;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save orchestra';
      set({ error: errorMessage, isLoading: false });
      console.error('Error saving orchestra:', err);
      throw err;
    }
  },

  removeOrchestra: async (orchestraId) => {
    set({ isLoading: true, error: null });
    try {
      await orchestraService.removeOrchestra(orchestraId);

      set({
        orchestras: get().orchestras.filter((o) => o._id !== orchestraId),
        selectedOrchestra:
          get().selectedOrchestra?._id === orchestraId
            ? null
            : get().selectedOrchestra,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove orchestra';
      set({ error: errorMessage, isLoading: false });
      console.error('Error removing orchestra:', err);
      throw err;
    }
  },

  setFilter: (filterBy) => {
    set({ filterBy: { ...get().filterBy, ...filterBy } });
  },

  clearSelectedOrchestra: () => {
    set({ selectedOrchestra: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
