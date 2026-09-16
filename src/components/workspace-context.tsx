'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  freshState,
  loadState,
  saveState,
  resetState,
  toggleCompletion,
  STORAGE_KEY,
} from '@/domain/persistence';
import type { DemoState, Stage } from '@/domain/types';
interface WorkspaceContext {
  state: DemoState;
  ready: boolean;
  error: string;
  toggle: (id: string) => void;
  updateApplication: (id: string, patch: { stage?: Stage; followUp?: string | null }) => void;
  reset: () => void;
}
const Context = createContext<WorkspaceContext | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(freshState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    function restore() {
      try {
        setState(loadState(localStorage));
        setError('');
      } catch {
        setError('Saved data could not be read. Reset the demo to restore the original records.');
      }
      setReady(true);
    }
    restore();
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) restore();
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function commit(next: DemoState) {
    setState(next);
    try {
      saveState(localStorage, next);
      setError('');
    } catch {
      setError('Changes could not be saved. They will last only in this tab.');
    }
  }
  function reset() {
    try {
      setState(resetState(localStorage));
      setError('');
    } catch {
      setState(freshState());
      setError('Demo restored in this tab. Browser storage is unavailable.');
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        ready,
        error,
        toggle: (id) => commit(toggleCompletion(state, id)),
        updateApplication: (id, patch) =>
          commit({
            ...state,
            applications: state.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
          }),
        reset,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error('Workspace provider missing');
  return context;
}
