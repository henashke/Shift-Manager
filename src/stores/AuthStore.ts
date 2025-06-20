import { makeAutoObservable } from 'mobx';

class AuthStore {
  username: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setUsername(username: string) {
    this.username = username;
  }

  logout() {
    this.username = null;
  }
}

const authStore = new AuthStore();
export default authStore;

