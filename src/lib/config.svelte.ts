const BACKEND_URL = 'http://localhost:3000';
const BACKEND_URL_STORAGE_KEY = 'backend_url';

class AppConfig {
  baseUrl = $state("");
  apiConnected = $state(false);
  apiPending = $state(false);

  constructor() {
    this.setBaseUrl(BACKEND_URL);
  }

  setBaseUrl(url: string) {
    // Normalize: strip trailing slash
    const cleanUrl = url.trim().replace(/\/+$/, '');
    this.baseUrl = cleanUrl;

    if (typeof window !== 'undefined') {
      localStorage.setItem(BACKEND_URL_STORAGE_KEY, cleanUrl);
    }

    // Immediately test connection when changed
    this.checkHealth();
  }

  async checkHealth() {
    this.apiPending = true;
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      this.apiConnected = res.ok;
    } catch {
      this.apiConnected = false;
    } finally {
      this.apiPending = false;
    }
  }
}

export const config = new AppConfig();