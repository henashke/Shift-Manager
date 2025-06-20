import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Box, Avatar, useTheme, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Konan } from '../stores/ShiftStore';

interface KonanInfoDialogProps {
  open: boolean;
  konan: Konan | undefined;
  onClose: () => void;
}

const KonanInfoDialog: React.FC<KonanInfoDialogProps> = ({ open, konan, onClose }) => {
  const theme = useTheme();
  if (!konan) return null;

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
          {konan.name[0]}
        </Avatar>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {konan.name}
        </Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            מזהה: <b>{konan.id}</b>
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            ניקוד: <b>{konan.score}</b>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default KonanInfoDialog;
