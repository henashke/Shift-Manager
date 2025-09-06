import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {Box, DialogContent} from '@mui/material';
import {Shift} from '../../stores/ShiftStore';
import CommonDialog from "./CommonDialog";
import NativeSelect from "../basicSharedComponents/NativeSelect";


interface AssignToShiftDialogProps<T> {
    open: boolean;
    onClose: () => void;
    shift: Shift | null;
    itemList: T[];
    itemTitle: string;
    getItemName: (item: T) => string;
    assignFunction: (shift: Shift, item: T) => void;
}

function AssignToShiftDialog<T>({
                                    open,
                                    onClose,
                                    shift,
                                    itemList,
                                    itemTitle,
                                    getItemName,
                                    assignFunction
                                }: AssignToShiftDialogProps<T>) {
    const [selectedItem, setSelectedItem] = useState<T | undefined>(undefined);

    if (!shift) return <></>;
    const handleAssign = (item: T) => {
        assignFunction(shift, item);
        onClose();
    };

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newItem = Array.from(itemList.values()).find(item => getItemName(item) === event.target.value);
        if (newItem) {
            setSelectedItem(newItem);
        }
    };

    return (
        <CommonDialog open={open}
                      title={"שבץ " + itemTitle + " ל" + shift.type}
                      content={<DialogContent sx={{direction: 'rtl'}}>
                          <Box sx={{direction: 'rtl'}}>
                              <NativeSelect title={itemTitle} options={itemList.map(getItemName)}
                                            onChange={handleSelectChange}/>
                          </Box>
                      </DialogContent>}
                      disableConfirmButton={!selectedItem}
                      handleConfirm={() => selectedItem && handleAssign(selectedItem)}
                      handleDialogClose={onClose}/>
    )
}

export default observer(AssignToShiftDialog) as typeof AssignToShiftDialog;
