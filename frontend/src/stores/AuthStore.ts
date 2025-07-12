import {makeAutoObservable} from 'mobx';

class AuthStore {
  username: string | null = null;
  token: string | null = null;
  role: string | null = null;

  constructor() {
    makeAutoObservable(this);
    const savedUsername = localStorage.getItem('username');
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    if (savedUsername && savedToken) {
      this.username = savedUsername;
      this.token = savedToken;
      this.role = savedRole;
    }
  }

  setAuth(username: string, token: string, role: string) {
    this.username = username;
    this.token = token;
    this.role = role;
    localStorage.setItem('username', username);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    
    // Trigger data fetching after authentication
    this.refreshAllData();
  }

  refreshAllData() {
    // This method will be called after successful login
    // The stores will check authentication and fetch data if needed
    // Don't reload the page, let the App component handle data fetching
  }

  logout() {
    this.username = null;
    this.token = null;
    this.role = null;
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }

  getAuthHeaders(): Record<string, string> {
    if (this.token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }
}

const authStore = new AuthStore();
export default authStore;
