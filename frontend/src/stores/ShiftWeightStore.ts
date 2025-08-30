import {makeAutoObservable, runInAction} from 'mobx';
import config from '../config';
import {ShiftType} from './ShiftStore';
import authStore from './AuthStore';
import notificationStore from './NotificationStore';

export interface ShiftWeight {
    day: string;
    shiftType: ShiftType;
    weight: number;
}

export interface ShiftWeightPreset {
    name: string;
    weights: ShiftWeight[];
}

class ShiftWeightStore {
    currentPresetObject: ShiftWeightPreset = {name: '', weights: []};
    presets: Map<string, ShiftWeightPreset> = new Map();
    loading: boolean = false;
    pendingPreset: ShiftWeightPreset | null = null;

    constructor() {
        makeAutoObservable(this);
        // Don't fetch automatically - will be called when needed
    }

    async fetchPresets() {
        // Only fetch if authenticated
        if (!authStore.isAuthenticated()) {
            return;
        }

        this.loading = true;
        try {
            const res = await fetch(`${config.API_BASE_URL}/shift-weight-settings`, {
                headers: authStore.getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch shift weight presets');
            const data = await res.json();
            runInAction(() => {
                this.presets = new Map(Object.entries(data.presets));
                this.currentPresetObject = data.currentPresetObject;
                this.loading = false;
            });
        } catch (e) {
            runInAction(() => {
                this.loading = false;
            });
            console.error(e);
        }
    }

    async savePreset(preset: ShiftWeightPreset) {
        try {
            const res = await fetch(`${config.API_BASE_URL}/shift-weight-settings/preset`, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify(preset)
            });
            if (!res.ok) {
                if (res.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    throw new Error('Failed to save shift weight preset');
                }
                return;
            }
            // Optionally, refresh presets from server
            await this.fetchPresets();
        } catch (e) {
            console.error('Failed to save preset', e);
        }
    }

    async setCurrentPresetOnServer(presetName: string) {
        try {
            if (!this.presets.has(presetName)) {
                return
            }
            const res = await fetch(`${config.API_BASE_URL}/shift-weight-settings/current-preset`, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({currentPreset: presetName})
            });
            if (res.ok) {
                this.currentPresetObject = this.presets.get(presetName)!;
            } else if (res.status === 403) {
                notificationStore.showUnauthorizedError();
            }
        } catch (e) {
            console.error('Failed to set default preset', e);
        }
    }

    setPendingPresetFromName(name: string) {
        const found = this.presets.get(name);
        if (found) {
            this.pendingPreset = JSON.parse(JSON.stringify(found));
        } else {
            // If not found, create a new preset with default weights
            this.pendingPreset = {
                name,
                weights: []
            };
        }
    }

    setPendingPreset(preset: ShiftWeightPreset) {
        this.pendingPreset = {...preset, weights: preset.weights.map(w => ({...w}))};
    }
}

const shiftWeightStore = new ShiftWeightStore();
export default shiftWeightStore;
