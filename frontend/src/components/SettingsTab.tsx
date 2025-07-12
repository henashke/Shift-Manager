import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Container,
    FormControl,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
import {observer} from 'mobx-react-lite';
import shiftWeightStore, {ShiftWeight} from '../stores/ShiftWeightStore';
import PresetNameDialog from './dialogs/PresetNameDialog';
import {ShiftType} from "../stores/ShiftStore";
import authStore from '../stores/AuthStore';
import notificationStore from '../stores/NotificationStore';

const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const shiftTypes: ShiftType[] = ['יום', 'לילה'];

const SettingsTab: React.FC = observer(() => {
    const [preset, setPreset] = useState<string>('');
    const [settings, setSettings] = useState<Record<string, Record<ShiftType, string>>>({});
    const [presetNameDialogOpen, setPresetNameDialogOpen] = useState(false);

    useEffect(() => {
        shiftWeightStore.fetchPresets();
        if (!preset && shiftWeightStore.currentPreset) {
            setPreset(shiftWeightStore.currentPreset);
        }
    }, [shiftWeightStore.currentPreset]);

    useEffect(() => {
        if (preset && shiftWeightStore.presets.size > 0) {
            const presetObj = shiftWeightStore.presets.get(preset);
            if (presetObj) {
                const newSettings: Record<string, Record<ShiftType, string>> = {};
                daysOfWeek.forEach(day => {
                    newSettings[day] = {'יום': '0', 'לילה': '0'};
                });
                presetObj.weights.forEach(w => {
                    if (!newSettings[w.day]) newSettings[w.day] = {'יום': '0', 'לילה': '0'};
                    newSettings[w.day][w.shiftType] = w.weight.toString();
                });
                setSettings(newSettings);
            }
        }
    }, [preset, shiftWeightStore.presets]);

    // When preset or store changes, update pendingPreset
    useEffect(() => {
        if (preset) {
            shiftWeightStore.setPendingPresetFromName(preset);
        }
    }, [preset]);

    // When pendingPreset changes, update settings
    useEffect(() => {
        if (shiftWeightStore.pendingPreset) {
            const newSettings: Record<string, Record<ShiftType, string>> = {};
            daysOfWeek.forEach(day => {
                newSettings[day] = {'יום': '0', 'לילה': '0'};
            });
            shiftWeightStore.pendingPreset.weights.forEach(w => {
                if (!newSettings[w.day]) newSettings[w.day] = {'יום': '0', 'לילה': '0'};
                newSettings[w.day][w.shiftType] = w.weight.toString();
            });
            setSettings(newSettings);
        }
    }, []);

    const handleChange = (day: string, shiftType: ShiftType, value: string) => {
        setSettings(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [shiftType]: value
            }
        }));
    };

    const handlePresetSelect = (event: SelectChangeEvent) => {
        setPreset(event.target.value as string);
        shiftWeightStore.setPendingPresetFromName(event.target.value as string);
    };

    const handleSave = () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setPresetNameDialogOpen(true);
    };

    const handlePresetNameSave = (name: string) => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setPresetNameDialogOpen(false);
        const weights: ShiftWeight[] = [];
        for (const day of daysOfWeek) {
            for (const type of shiftTypes) {
                weights.push({day, shiftType: type, weight: Number(settings[day]?.[type] ?? 0)});
            }
        }
        shiftWeightStore.savePreset({name, weights});
        setPreset(name);
    };

    const handleMakeDefault = async () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        if (!preset) return;
        await shiftWeightStore.setCurrentPresetOnServer(preset);
    };

    const currentPresetObj = shiftWeightStore.presets ? shiftWeightStore.presets.get(preset) : undefined;
    const isSettingsDifferent = () => {
        if (!currentPresetObj) return true;
        for (const day of daysOfWeek) {
            for (const type of shiftTypes) {
                const storeWeight = currentPresetObj.weights.find(w => w.day === day && w.shiftType === type)?.weight ?? 0;
                if (String(storeWeight) !== (settings[day]?.[type] ?? '0')) return true;
            }
        }
        return false;
    };

    const showSaveButton = isSettingsDifferent();
    const showMakeDefaultButton = !showSaveButton;
    const isDefaultPreset = preset === shiftWeightStore.currentPreset;
    const presetOptions = Array.from(shiftWeightStore.presets.keys());

    return (
        <Container maxWidth="xl" dir="rtl" sx={{height: '100vh', mt: 4}}>
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', gap: 2}}>
                <span style={{fontWeight: 700, fontSize: '1.2em'}}>מציג פריסט:</span>
                <FormControl size="small" sx={{minWidth: 200}}>
                    <Select
                        value={preset}
                        onChange={handlePresetSelect}
                        displayEmpty
                        renderValue={() => preset || <span style={{color: '#aaa'}}>בחר פריסט</span>}
                    >
                        {presetOptions.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {showSaveButton && (
                    <Button variant="contained" color="primary" onClick={handleSave} sx={{ml: 2}}>
                        שמור
                    </Button>
                )}
                {showMakeDefaultButton && preset && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleMakeDefault}
                        sx={{ml: 2}}
                        disabled={isDefaultPreset}
                    >
                        הפוך לברירת מחדל
                    </Button>
                )}
                <PresetNameDialog
                    open={presetNameDialogOpen}
                    defaultValue={preset}
                    onClose={() => setPresetNameDialogOpen(false)}
                    onSave={handlePresetNameSave}
                />
            </Box>
            <TableContainer component={Paper} sx={{borderRadius: 3, boxShadow: 3}}>
                <Table className="shift-table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">יום</TableCell>
                            {shiftTypes.map(type => (
                                <TableCell align="center" key={type}>{type}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {daysOfWeek.map(day => {
                            return (
                                <TableRow key={day}>
                                    <TableCell align="center" sx={{fontWeight: 700}}>{day}</TableCell>
                                    {shiftTypes.map(type => (
                                        <TableCell align="center" key={type}>
                                            <TextField
                                                variant="outlined"
                                                size="small"
                                                value={settings[day] ? settings[day][type] : '0'}
                                                onChange={e => handleChange(day, type, e.target.value)}
                                                sx={{width: '100px'}}
                                                inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}}
                                                placeholder="0"
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
});

export default SettingsTab;
