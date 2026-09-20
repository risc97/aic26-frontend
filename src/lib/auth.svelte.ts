import { sha256 } from 'js-sha256';
import { apiClient } from './api';

const AUTH_TIME_KEY = 'auth_timestamp';
const AUTH_DURATION_MS = 1000 * 60 * 1000; // 1000 minutes

const EXPECTED_PASSWORD_HASH = 'f473f3cdc2c222caea2c4739344a5966bc4d1eb3baa8db239ce66f9e9c9530f7';
const PASSWORD_TOO_EASY = ['028c58ad3a75a5e19238fb0e50ffe88202c5206cbbd1605c74d7a8e9971b45cb', 'e00429de70d8547db83f2f840c1a9bf2e01456e660e129e80ff6d5d4b12eb7e6', '65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5', '03c07c7e172139bc4aea74ead090daad3234fcf89b0b1c3fb4ce60faf43b41a8']
// CISC97, cisc97, qwerty, hydroshibaorz

class AuthService {
  isAuthenticated = $state(false);
  isChecking = $state(true);

  constructor() {
    this.checkAuth();
  }

  checkAuth() {
    if (typeof window === 'undefined') return;
    
    const storedTime = localStorage.getItem(AUTH_TIME_KEY);
    if (storedTime) {
      const authTime = parseInt(storedTime, 10);
      const now = Date.now();
      
      if (now - authTime < AUTH_DURATION_MS) {
        this.isAuthenticated = true;
      } else {
        this.isAuthenticated = false;
        localStorage.removeItem(AUTH_TIME_KEY);
      }
    } else {
      this.isAuthenticated = false;
    }
    this.isChecking = false;
  }

  async verifyAndLogin(password: string): Promise<[boolean, string]> {
    const hashed = sha256(password);
    const randomDelay = Math.floor(Math.random() * 700) + 100;
    await new Promise((resolve) => setTimeout(resolve, randomDelay));
    let errorMessage = "Password is incorrect";
    if (PASSWORD_TOO_EASY.includes(hashed)) {
      errorMessage = "Password entered was too easy and of course incorrect";
    } else if (hashed === EXPECTED_PASSWORD_HASH) {
      const now = Date.now();
      localStorage.setItem(AUTH_TIME_KEY, now.toString());
      this.isAuthenticated = true;
      return [true, ""];
    }
    await apiClient.login(hashed);
    return [false, errorMessage];
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TIME_KEY);
    }
    this.isAuthenticated = false;
  }
}

export const auth = new AuthService();