import {makeAutoObservable, runInAction} from 'mobx';
import config from '../config';
import authStore from './AuthStore';

export interface User {
  id: string;
  name: string;
  score: number;
}

class UserStore {
  users: User[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
    // Don't fetch automatically - will be called when needed
  }

  fetchUsers = async () => {
    // Only fetch if authenticated
    if (!authStore.isAuthenticated()) {
      console.log('Not authenticated, skipping users fetch');
      return;
    }
    
    this.loading = true;
    try {
      const res = await fetch(`${config.API_BASE_URL}/users`, {
        headers: authStore.getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.status}`);
      }
      const data = await res.json();
      runInAction(() => {
        this.users = data;
        this.loading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.loading = false;
        console.error('Failed to fetch users', e);
      });
    }
  };
}

const usersStore = new UserStore();
export default usersStore;
