import React from 'react';
import { observer } from 'mobx-react-lite';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import shiftStore from '../stores/ShiftStore';
import konanimStore from '../stores/KonanimStore';

interface AssignKonanDialogProps {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
}

const AssignKonanDialog: React.FC<AssignKonanDialogProps> = observer(({ open, onClose, shiftId }) => {
  if (!shiftId) return null;
  const shift = shiftStore.shifts.find(s => s.id === shiftId);
  if (!shift) return null;

  const handleAssign = (konanId: string) => {
      shiftStore.assignKonan(shiftId, konanId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Assign Konan to {shift.day} {shift.type}</DialogTitle>
      <DialogContent>
        <List>
          {konanimStore.konanim.map(konan => (
            <ListItem key={konan.id} disablePadding>
              <ListItemButton onClick={() => handleAssign(konan.id)}>
                <ListItemText primary={konan.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
});

export default AssignKonanDialog;
