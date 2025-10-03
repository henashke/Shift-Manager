import {makeAutoObservable, runInAction} from 'mobx';
import config from '../config';
import authStore from './AuthStore';
import notificationStore from "./NotificationStore";
import {User} from "./ShiftStore";

class UserStore {
  users: User[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  fetchUsers = async () => {
    if (!authStore.isAuthenticated()) {
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
        this.users = data.sort((a: User, b: User) => a.name.localeCompare(b.name)) as User[];
        this.loading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.loading = false;
        console.error('Failed to fetch users', e);
      });
    }
  };

  editUser = async (user: User) => {
    if (!authStore.isAdmin()) {
      notificationStore.showUnauthorizedError();
    }

    try {
      const res = await fetch(`${config.API_BASE_URL}/users/${user.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders()
        },
        body: JSON.stringify(user)
      });
      if (!res.ok) {
        throw new Error(`Failed to edit user: ${res.status}`);
      }
      runInAction(() => {
        const index = this.users.findIndex(u => u.name === user.name);
        if (index !== -1) {
          this.users[index] = user;
        }
      });
    } catch (e) {
      console.error('Failed to edit user', e);
      throw e;
    }
  };

  deleteUser = async (username: string) => {
    if (!authStore.isAdmin()) {
      notificationStore.showUnauthorizedError();
    }

    try {
      const res = await fetch(`${config.API_BASE_URL}/users/${username}`, {
        method: 'DELETE',
        headers: {
          ...authStore.getAuthHeaders()
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to delete user: ${res.status}`);
      }
      notificationStore.showSuccess('הכונן ' + username + ' נמחק בהצלחה')
      runInAction(() => {
        this.users = this.users.filter(u => u.name !== username);
      });
    } catch (e) {
        notificationStore.showError('שגיאה בעת מחיקת הכונן')
        console.error('Failed to delete user', e);
      throw e;
    }
  };
}

const usersStore = new UserStore();
export default usersStore;
