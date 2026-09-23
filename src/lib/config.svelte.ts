const BACKEND_URL = 'http://localhost:3000';
const BACKEND_URL_STORAGE_KEY = 'backend_url';

const MEDIA_URL = 'http://localhost:3000';
const MEDIA_URL_STORAGE_KEY = 'media_url';

type SetUrlOptions = { check?: boolean };

class AppConfig {
  baseUrl = $state("");
  mediaUrl = $state("");
  baseApiConnected = $state(false);
  mediaApiConnected = $state(false);
  baseApiPending = $state(false);
  mediaApiPending = $state(false);

  // Backwards-compatible combined pending flag (true if either check is running)
  get apiPending() {
    return this.baseApiPending || this.mediaApiPending;
  }

  constructor() {
    // Don't fire two separate health checks during init - set both, then check once.
    this.setBaseUrl(BACKEND_URL, { check: false });
    this.setMediaUrl(MEDIA_URL, { check: false });
    this.checkHealth();
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