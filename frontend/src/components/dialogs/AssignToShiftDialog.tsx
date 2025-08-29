import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {Box, DialogContent, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from '@mui/material';
import {Shift} from '../../stores/ShiftStore';
import CommonDialog from "./CommonDialog";

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

    const handleSelectChange = (event: SelectChangeEvent) => {
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

                              <FormControl fullWidth sx={{mt: 1}}>
                                  <InputLabel id="item-select-label">{itemTitle}</InputLabel>
                                  <Select sx={{direction: 'ltr'}}
                                          labelId="item-select-label"
                                          id="item-select"
                                          value={selectedItem ? getItemName(selectedItem) : undefined}
                                          label="item"
                                          onChange={handleSelectChange}
                                  >
                                      {itemList.map((item: T) => (
                                          <MenuItem key={getItemName(item)} value={getItemName(item)}>
                                              {getItemName(item)}
                                          </MenuItem>
                                      ))}
                                  </Select>
                              </FormControl>
                          </Box>
                      </DialogContent>}
                      disableConfirmButton={!selectedItem}
                      handleConfirm={() => selectedItem && handleAssign(selectedItem)}
                      handleDialogClose={onClose}/>
    )
}

export default observer(AssignToShiftDialog) as typeof AssignToShiftDialog;
