import React from 'react';
import { observer } from 'mobx-react-lite';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import store from '../stores/ShiftStore';

interface AssignEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
}

const AssignEmployeeDialog: React.FC<AssignEmployeeDialogProps> = observer(({ open, onClose, shiftId }) => {
  if (!shiftId) return null;
  const shift = store.shifts.find(s => s.id === shiftId);
  if (!shift) return null;

  const handleAssign = (employeeId: string) => {
    store.assignEmployee(shiftId, employeeId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Assign Employee to {shift.day} {shift.type}</DialogTitle>
      <DialogContent>
        <List>
          {store.konanim.map(emp => (
            <ListItem key={emp.id} disablePadding>
              <ListItemButton onClick={() => handleAssign(emp.id)}>
                <ListItemText primary={emp.name} />
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

export default AssignEmployeeDialog;

