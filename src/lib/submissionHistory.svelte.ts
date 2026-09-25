// Local-storage-backed submission history store.
//
// Every DRES submission (KIS / QA / TRAKE) made through `dresClient` in
// `api.ts` is recorded here, success or failure, so the user can review
// what they've already submitted this session (and across page reloads,
// since it's persisted to localStorage).

export type SubmissionType = 'KIS' | 'QA' | 'TRAKE';

export interface SubmissionHistoryEntry {
  id: string;
  timestamp: number; // Date.now()
  type: SubmissionType;
  videoId: string;

  // KIS-specific
  timeMs?: number;
  rangeMs?: number;

  // QA-specific
  answer?: string;

  // TRAKE-specific
  frameIds?: Array<string | number>;

  // Outcome
  success: boolean; // the HTTP request itself succeeded
  correct?: boolean; // DRES judged the answer correct (only meaningful when success)
  description?: string; // DRES's description string, if any
  error?: string; // set when the request threw (network/validation/etc error)
}

const STORAGE_KEY = 'cisc97_submission_history';
const MAX_ENTRIES = 500;

function loadFromStorage(): SubmissionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SubmissionHistoryEntry[];
  } catch {
    return [];
  }
}

function saveToStorage(entries: SubmissionHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable or quota exceeded; fail silently.
  }
}

class SubmissionHistoryStore {
  entries = $state<SubmissionHistoryEntry[]>(loadFromStorage());

  add(entry: Omit<SubmissionHistoryEntry, 'id' | 'timestamp'>) {
    const full: SubmissionHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    // Newest first, capped so localStorage doesn't grow unbounded.
    this.entries = [full, ...this.entries].slice(0, MAX_ENTRIES);
    saveToStorage(this.entries);
  }

  remove(id: string) {
    this.entries = this.entries.filter((e) => e.id !== id);
    saveToStorage(this.entries);
  }

  clear() {
    this.entries = [];
    saveToStorage(this.entries);
  }
}

export const submissionHistory = new SubmissionHistoryStore();