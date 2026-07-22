// grid-state.store.ts
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { DEFAULT_GRID_STATE, GridState } from '../models/grid-state.model';
import { STORAGE_KEYS } from '../services/auth-storage.setvice';


function loadFromStorage(): Record<string, GridState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GRID_STATE);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveToStorage(states: Record<string, GridState>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GRID_STATE, JSON.stringify(states));
  } catch {
    console.error('Failed to save grid state');
  }
}

export const GridStateStore = signalStore(
  { providedIn: 'root' },
  withState({ states: loadFromStorage() }),
  withMethods((store) => ({

    getState(pageKey: string): GridState {
      return store.states()[pageKey] ?? { ...DEFAULT_GRID_STATE };
    },

    setState(pageKey: string, state: GridState): void {
      const updated = { ...store.states(), [pageKey]: state };
      patchState(store, { states: updated });
      saveToStorage(updated);
    },

    resetState(pageKey: string): void {
      const updated = { ...store.states() };
      delete updated[pageKey];
      patchState(store, { states: updated });
      saveToStorage(updated);
    },

    resetAll(): void {
      patchState(store, { states: {} });
      localStorage.removeItem(STORAGE_KEYS.GRID_STATE);
    },

  }))
);