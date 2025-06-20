import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import store from '../stores/ShiftStore';

interface AddKonanDialogProps {
  open: boolean;
  onClose: () => void;
}

const AddKonanDialog: React.FC<AddKonanDialogProps> = observer(({ open, onClose }) => {
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      store.addKonan(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Konan</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Konan Name"
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained">Add</Button>
      </DialogActions>
    </Dialog>
  );
});

export default AddKonanDialog;

