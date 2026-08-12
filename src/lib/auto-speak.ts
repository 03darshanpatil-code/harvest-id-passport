// Shared, persisted "auto-speak AI answers" preference. Both the Farm
// Assistant header and Settings write to the same store, so toggling either
// one updates the other live, and the value survives page reloads.

const STORAGE_KEY = "harvestid-autospeak";

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let value = readStored();
const listeners = new Set<(next: boolean) => void>();

export function getAutoSpeak(): boolean {
  return value;
}

export function setAutoSpeak(next: boolean): void {
  value = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // storage unavailable — preference lives for this session only
  }
  listeners.forEach((listener) => listener(next));
}

export function subscribeAutoSpeak(listener: (next: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
