import { makeAutoObservable, runInAction } from 'mobx';
import config from '../config';

export interface Konan {
  id: string;
  name: string;
  score: number;
}

class KonanimStore {
  konanim: Konan[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  fetchKonanim = async () => {
    this.loading = true;
    try {
      const res = await fetch(`${config.API_BASE_URL}/konanim`);
      const data = await res.json();
      runInAction(() => {
        this.konanim = data;
        this.loading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  getKonanById = (id: string) => {
    return this.konanim.find(k => k.id === id);
  };
}

const konanimStore = new KonanimStore();
export default konanimStore;

