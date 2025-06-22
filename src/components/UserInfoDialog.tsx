import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Box, Avatar, useTheme, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { User } from '../stores/ShiftStore';

interface UserInfoDialogProps {
  open: boolean;
  user: User | undefined;
  onClose: () => void;
}

const UserInfoDialog: React.FC<UserInfoDialogProps> = ({ open, user, onClose }) => {
  const theme = useTheme();
  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.palette.primary.main, color: theme.palette.common.white }}>
        פרטי משתמש
        <IconButton onClick={onClose} sx={{ color: theme.palette.common.white }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: theme.palette.background.default }}>
        <Avatar sx={{ width: 72, height: 72, bgcolor: theme.palette.primary.main, mb: 2, fontSize: 32 }}>
          {user.name[0]}
        </Avatar>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {user.name}
        </Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            מזהה: <b>{user.id}</b>
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            ניקוד: <b>{user.score}</b>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UserInfoDialog;
