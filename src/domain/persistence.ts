import { applications, assignments, initialCompleted } from '../fixtures/semester';
import { stages, type DemoState } from './types';
export const STORAGE_KEY = 'command-center-demo-v1';
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const freshState = (): DemoState => ({
  version: 1,
  completed: [...initialCompleted],
  applications: applications.map((a) => ({ ...a })),
});
export function parseState(raw: string | null): DemoState {
  if (!raw) return freshState();
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('completed' in value) ||
    !Array.isArray(value.completed) ||
    !('applications' in value) ||
    !Array.isArray(value.applications)
  )
    throw new Error('Invalid saved state');
  const completed = value.completed.filter(
    (id): id is string => typeof id === 'string' && assignments.some((a) => a.id === id),
  );
  const savedApplications = value.applications;
  const restored = applications.map((base) => {
    const saved = savedApplications.find(
      (a: unknown) => a && typeof a === 'object' && 'id' in a && a.id === base.id,
    );
    if (
      !saved ||
      !stages.includes(saved.stage) ||
      !(
        saved.followUp === null ||
        (typeof saved.followUp === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(saved.followUp) &&
          !Number.isNaN(Date.parse(saved.followUp)) &&
          new Date(saved.followUp).toISOString().slice(0, 10) === saved.followUp)
      )
    )
      throw new Error('Invalid application record');
    return { ...base, stage: saved.stage, followUp: saved.followUp };
  });
  return { version: 1, completed: [...new Set(completed)], applications: restored };
}
export function loadState(storage: StorageLike) {
  return parseState(storage.getItem(STORAGE_KEY));
}
export function saveState(storage: StorageLike, state: DemoState) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
export function resetState(storage: StorageLike) {
  storage.removeItem(STORAGE_KEY);
  return freshState();
}
export function toggleCompletion(state: DemoState, id: string): DemoState {
  if (!assignments.some((a) => a.id === id)) return state;
  return {
    ...state,
    completed: state.completed.includes(id)
      ? state.completed.filter((x) => x !== id)
      : [...state.completed, id],
  };
}
