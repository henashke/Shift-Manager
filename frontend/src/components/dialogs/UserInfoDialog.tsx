import React from 'react';
import {Avatar, Box, Dialog, DialogContent, DialogTitle, IconButton, Typography, useTheme} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {stringToColor} from "../shiftTable/ShiftTable";
import usersStore from "../../stores/UsersStore";

interface UserInfoDialogProps {
  open: boolean;
  username: string | undefined;
  onClose: () => void;
}

const UserInfoDialog: React.FC<UserInfoDialogProps> = ({open, username, onClose}) => {
  const user = usersStore.users.find(u => u.name === username);
  const theme = useTheme();
  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: stringToColor(user.name),
        color: theme.palette.common.white
      }}>
        פרטי משתמש
        <IconButton onClick={onClose} sx={{ color: theme.palette.common.white }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: theme.palette.background.default }}>
        <Avatar sx={{width: 72, height: 72, bgcolor: stringToColor(user.name), mb: 2, fontSize: 32}}>
          {user.name[0]}
        </Avatar>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {user.name}
        </Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            מזהה: <b>{user.name}</b>
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
