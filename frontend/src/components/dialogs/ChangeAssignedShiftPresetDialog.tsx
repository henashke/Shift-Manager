import React, {useState} from 'react';
import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent,} from '@mui/material';
import shiftStore, {AssignedShift} from '../../stores/ShiftStore';
import shiftWeightStore, {ShiftWeightPreset} from '../../stores/ShiftWeightStore';
import {observer} from 'mobx-react-lite';
import CommonDialog from "./CommonDialog";

interface ChangeAssignedShiftPresetProps {
    open: boolean;
    onClose: () => void;
    assignedShift: AssignedShift;
}

const ChangeAssignedShiftPresetDialog: React.FC<ChangeAssignedShiftPresetProps> = observer(({
                                                                                          open,
                                                                                          onClose,
                                                                                          assignedShift,
                                                                                      }) => {
    const [selectedPreset, setSelectedPreset] = useState<ShiftWeightPreset>(assignedShift?.preset);
    const handlePresetChange = (event: SelectChangeEvent) => {
        const newPreset = Array.from(shiftWeightStore.presets.values()).find(p => p.name === event.target.value);
        if (newPreset) {
            setSelectedPreset(newPreset);
        }
    };

    const handleSave = () => {
        shiftStore.assignShiftPending({...assignedShift, preset: selectedPreset});
        onClose();
    };

    const isSaveDisabled = selectedPreset.name === assignedShift.preset.name;
    const availablePresets = Array.from(shiftWeightStore.presets.values());

    return (
        <CommonDialog open={open} title={"שינוי פריסט למשמרת"} content={
                <FormControl fullWidth sx={{mt: 1}}>
                    <InputLabel id="preset-select-label">פריסט</InputLabel>
                    <Select sx={{direction: 'ltr'}}
                            labelId="preset-select-label"
                            id="preset-select"
                            value={selectedPreset.name}
                            label="Preset"
                            onChange={handlePresetChange}
                    >
                        {availablePresets.map((preset) => (
                            <MenuItem key={preset.name} value={preset.name}>
                                {preset.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
        } handleConfirm={handleSave} handleDialogClose={onClose} disableConfirmButton={isSaveDisabled}/>
    );
});

export default ChangeAssignedShiftPresetDialog;
