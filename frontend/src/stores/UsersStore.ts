import {makeAutoObservable, runInAction} from 'mobx';
import config from '../config';

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
    this.fetchUsers();
  }

  fetchUsers = async () => {
    this.loading = true;
    try {
      const res = await fetch(`${config.API_BASE_URL}/users`);
      const data = await res.json();
      runInAction(() => {
        this.users = data;
        this.loading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.loading = false;
      });
    }
  };
}

const usersStore = new UserStore();
export default usersStore;
