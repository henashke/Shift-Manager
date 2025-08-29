import React, {useState} from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
} from '@mui/material';
import shiftStore, {AssignedShift} from '../../stores/ShiftStore';
import shiftWeightStore, {ShiftWeightPreset} from '../../stores/ShiftWeightStore';
import {observer} from 'mobx-react-lite';

interface ChangeAssignedShiftPresetProps {
    open: boolean;
    onClose: () => void;
    assignedShift: AssignedShift;
}

const ChangeAssignedShiftPreset: React.FC<ChangeAssignedShiftPresetProps> = observer(({
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
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Change Shift Preset</DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{mt: 1}}>
                    <InputLabel id="preset-select-label">Preset</InputLabel>
                    <Select
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                    color="primary"
                    variant="contained"
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
});

export default ChangeAssignedShiftPreset;
