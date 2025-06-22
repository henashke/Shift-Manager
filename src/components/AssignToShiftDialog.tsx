import React from 'react';
import {observer} from 'mobx-react-lite';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemText
} from '@mui/material';
import {Shift} from '../stores/ShiftStore';

interface AssignToShiftDialogProps<T> {
    open: boolean;
    onClose: () => void;
    shift: Shift | null;
    itemList: T[];
    getItemName: (item: T) => string;
    assignFunction: (shift: Shift, item: T) => void;
}

function AssignToShiftDialog<T>({
    open,
    onClose,
    shift,
    itemList,
    getItemName,
    assignFunction
}: AssignToShiftDialogProps<T>) {
    if (!shift) return null;
    const handleAssign = (item: T) => {
        assignFunction(shift, item);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>שבץ כונן ל{shift.type}</DialogTitle>
            <DialogContent>
                <List>
                    {itemList.map((item, index) => (
                        <ListItem key={`${getItemName(item)}-${index}`} disablePadding>
                            <ListItemButton onClick={() => handleAssign(item)}>
                                <ListItemText primary={getItemName(item)}/>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
        ;
}

export default observer(AssignToShiftDialog) as typeof AssignToShiftDialog;
