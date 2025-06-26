import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from '@mui/material';

import store from "../stores/ShiftStore";

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = observer(({ open, onClose }) => {
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      store.addUser(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add User</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="User Name"
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

export default AddUserDialog;
