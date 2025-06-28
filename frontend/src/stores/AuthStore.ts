import {makeAutoObservable} from 'mobx';

class AuthStore {
  username: string | null = null;

  constructor() {
    makeAutoObservable(this);
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      this.username = savedUsername;
    }
  }

  setUsername(username: string) {
    this.username = username;
    localStorage.setItem('username', username);
  }

  logout() {
    this.username = null;
    localStorage.removeItem('username');
  }
}

const authStore = new AuthStore();
export default authStore;
