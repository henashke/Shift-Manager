import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Box, Avatar, useTheme, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Employee } from '../stores/ShiftStore';

interface EmployeeInfoDialogProps {
  open: boolean;
  employee: Employee | undefined;
  onClose: () => void;
}

const EmployeeInfoDialog: React.FC<EmployeeInfoDialogProps> = ({ open, employee, onClose }) => {
  const theme = useTheme();
  if (!employee) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.palette.primary.main, color: theme.palette.common.white }}>
        פרטי כונן
        <IconButton onClick={onClose} sx={{ color: theme.palette.common.white }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: theme.palette.background.default }}>
        <Avatar sx={{ width: 72, height: 72, bgcolor: theme.palette.primary.main, mb: 2, fontSize: 32 }}>
          {employee.name[0]}
        </Avatar>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {employee.name}
        </Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            מזהה: <b>{employee.id}</b>
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            ניקוד: <b>{employee.score}</b>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeInfoDialog;

