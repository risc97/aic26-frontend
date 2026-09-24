const BACKEND_URL = 'http://localhost:3000';
const BACKEND_URL_STORAGE_KEY = 'backend_url';

const MEDIA_URL = 'http://localhost:3000';
const MEDIA_URL_STORAGE_KEY = 'media_url';

const SESSION_ID = '';
const SESSION_ID_STORAGE_KEY = 'session_id';

const EVALUATION_ID = '';
const EVALUATION_ID_STORAGE_KEY = 'evaluation_id';

type SetUrlOptions = { check?: boolean };

class AppConfig {
  baseUrl = $state("");
  mediaUrl = $state("");
  private _sessionId = $state("");
  evaluationId = "";
  baseApiConnected = $state(false);
  mediaApiConnected = $state(false);
  baseApiPending = $state(false);
  mediaApiPending = $state(false);
  loadEvaluationStatus = $state<"none" | "loading" | "success" | "error">("none");

  // Backwards-compatible combined pending flag (true if either check is running)
  get apiPending() {
    return this.baseApiPending || this.mediaApiPending;
  }

  constructor() {
    this.setBaseUrl(BACKEND_URL, { check: false });
    this.setMediaUrl(MEDIA_URL, { check: false });
    this.sessionId = this.readStored(SESSION_ID_STORAGE_KEY, SESSION_ID);
    this.evaluationId = this.readStored(EVALUATION_ID_STORAGE_KEY, EVALUATION_ID);
    this.checkHealth();
  }

  private readStored(key: string, fallback: string): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) ?? fallback;
    }
    return fallback;
  }

  setBaseUrl(url: string, { check = true }: SetUrlOptions = {}) {
    // Normalize: strip trailing slash
    const cleanUrl = url.trim().replace(/\/+$/, '');
    this.baseUrl = cleanUrl;

    if (typeof window !== 'undefined') {
      localStorage.setItem(BACKEND_URL_STORAGE_KEY, cleanUrl);
    }

    if (check) this.checkBaseHealth();
  }

  setMediaUrl(url: string, { check = true }: SetUrlOptions = {}) {
    // Normalize: strip trailing slash
    const cleanUrl = url.trim().replace(/\/+$/, '');
    this.mediaUrl = cleanUrl;

    if (typeof window !== 'undefined') {
      localStorage.setItem(MEDIA_URL_STORAGE_KEY, cleanUrl);
    }

    if (check) this.checkMediaHealth();
  }

  get sessionId(): string {
    return this._sessionId;
  }

  set sessionId(id: string) {
    const cleanId = id.trim();
    const changed = cleanId !== this._sessionId;

    this._sessionId = cleanId;

    if (typeof window !== "undefined") {
      if (cleanId) {
        localStorage.setItem(SESSION_ID_STORAGE_KEY, cleanId);
      } else {
        localStorage.removeItem(SESSION_ID_STORAGE_KEY);
      }
    }

    if (changed) {
      this.setEvaluationId("");
    }
  }

  setEvaluationId(id: string) {
    const cleanId = id.trim();
    this.evaluationId = cleanId;

    if (typeof window !== 'undefined') {
      if (cleanId) {
        localStorage.setItem(EVALUATION_ID_STORAGE_KEY, cleanId);
      } else {
        localStorage.removeItem(EVALUATION_ID_STORAGE_KEY);
      }
    }
  }

  clearEvaluationId() {
    this.setEvaluationId('');
  }

  async checkBaseHealth() {
    this.baseApiPending = true;
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      this.baseApiConnected = res.ok;
    } catch {
      this.baseApiConnected = false;
    } finally {
      this.baseApiPending = false;
    }
  }

  async checkMediaHealth() {
    this.mediaApiPending = true;
    try {
      const res = await fetch(`${this.mediaUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      this.mediaApiConnected = res.ok;
    } catch {
      this.mediaApiConnected = false;
    } finally {
      this.mediaApiPending = false;
    }
  }

  // Test both endpoints in parallel (previously sequential)
  async checkHealth() {
    await Promise.all([this.checkBaseHealth(), this.checkMediaHealth()]);
  }
}

export const config = new AppConfig();