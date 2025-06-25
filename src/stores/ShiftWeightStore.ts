import {makeAutoObservable, runInAction} from 'mobx';
import config from '../config';
import {ShiftType} from './ShiftStore';

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
    currentPreset: string = '';
    presets: Map<string, ShiftWeightPreset> = new Map();
    loading: boolean = false;
    pendingPreset: ShiftWeightPreset | null = null;

    constructor() {
        makeAutoObservable(this);
        this.fetchPresets();
    }

    get currentWeights(): ShiftWeight[] {
        const preset = this.presets.get(this.currentPreset);
        return preset ? preset.weights : [];
    }

    async fetchPresets() {
        this.loading = true;
        try {
            const res = await fetch(`${config.API_BASE_URL}/shift-weight-settings`);
            if (!res.ok) throw new Error('Failed to fetch shift weight presets');
            const data = await res.json();
            runInAction(() => {
                console.log(data.presets);
                console.log(Object.entries(data.presets))
                console.log(new Map(Object.entries(data.presets)))
                this.presets = new Map(Object.entries(data.presets));
                this.currentPreset = data.currentPreset;
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
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(preset)
            });
            if (!res.ok) throw new Error('Failed to save shift weight preset');
            // Optionally, refresh presets from server
            await this.fetchPresets();
        } catch (e) {
            console.error('Failed to save preset', e);
        }
    }

    async setCurrentPresetOnServer(presetName: string) {
        try {
            const res = await fetch(`${config.API_BASE_URL}/shift-weight-settings/current-preset`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({currentPreset: presetName})
            });
            if (res.ok) {
                this.currentPreset = presetName;
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
