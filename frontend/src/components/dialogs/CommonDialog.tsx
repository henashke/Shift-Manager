import React from 'react';
import {Button, Dialog, DialogContent, DialogTitle} from '@mui/material';

export interface CommonDialogProps {
    open: boolean;
    title: string;
    content: React.ReactNode;
    handleConfirm: (param?: any) => void;
    handleDialogClose: () => void;
}

const CommonDialog: React.FC<CommonDialogProps> = ({
                                                       open,
                                                       title,
                                                       content,
                                                       handleDialogClose,
                                                       handleConfirm
                                                   }) => (
    <Dialog open={open} onClose={handleDialogClose} sx={{direction: "rtl"}}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{content}</DialogContent>
        <Button onClick={handleDialogClose} color="primary">ביטול</Button>
        <Button onClick={handleConfirm} color="error">מחק</Button>
    </Dialog>
);

export default CommonDialog;


