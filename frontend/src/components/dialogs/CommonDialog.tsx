import React from 'react';
import {Box, Button, Dialog, DialogContent, DialogTitle} from '@mui/material';

export interface CommonDialogProps {
    open: boolean;
    title: string;
    content: React.ReactNode;
    handleConfirm: (param?: any) => void;
    handleDialogClose: () => void;
    warningDialog?: boolean;
    disableConfirmButton?: boolean;
}

const CommonDialog: React.FC<CommonDialogProps> = ({
                                                       open,
                                                       title,
                                                       content,
                                                       handleDialogClose,
                                                       handleConfirm,
                                                       warningDialog,
                                                       disableConfirmButton
                                                   }) => {
    const handleConfirmInternal = () => {
        handleConfirm();
        handleDialogClose();
    };

    return (
        <Dialog open={open} onClose={handleDialogClose} sx={{direction: "rtl"}}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>{content}</DialogContent>
            <Box sx={{display: 'flex', justifyContent: 'flex-end', m: 2, gap: 1}}>
                <Button variant={"contained"}
                        onClick={handleConfirmInternal}
                        disabled={disableConfirmButton}
                        color={warningDialog ? "error" : "success"}>אישור</Button>
                <Button variant={"contained"}
                        onClick={handleDialogClose}
                        color={warningDialog ? "primary" : "error"}>ביטול</Button>
            </Box>
        </Dialog>
    );
}

export default CommonDialog;


