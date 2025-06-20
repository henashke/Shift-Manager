import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  username: string;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onClose, onLogout, username }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>התנתקות</DialogTitle>
    <DialogContent>
      <Typography>האם אתה בטוח שברצונך להתנתק, {username}?</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">ביטול</Button>
      <Button onClick={onLogout} color="error" variant="contained">התנתק</Button>
    </DialogActions>
  </Dialog>
);

export default LogoutDialog;

