import React, {useState} from 'react';
import {Box,} from '@mui/material';
import shiftStore, {AssignedShift} from '../../stores/ShiftStore';
import shiftWeightStore, {ShiftWeightPreset} from '../../stores/ShiftWeightStore';
import {observer} from 'mobx-react-lite';
import CommonDialog from "./CommonDialog";
import NativeSelect from "../basicSharedComponents/NativeSelect";

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
    const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
        <CommonDialog open={open} title={"שינוי פריסט למשמרת"}
                      content={<Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                          <NativeSelect title={"פריסט"} options={availablePresets.map(preset => preset.name)}
                                        onChange={handlePresetChange}/>
                      </Box>
                      } handleConfirm={handleSave} handleDialogClose={onClose} disableConfirmButton={isSaveDisabled}/>
    );
});

export default ChangeAssignedShiftPresetDialog;
