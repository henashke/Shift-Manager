import React, {useState} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography} from '@mui/material';

interface PresetNameDialogProps {
    open: boolean;
    defaultValue: string;
    onClose: () => void;
    onSave: (name: string) => void;
}

const PresetNameDialog: React.FC<PresetNameDialogProps> = ({open, defaultValue, onClose, onSave}) => {
    const [value, setValue] = useState(defaultValue);

    React.useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue, open]);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>שמור פריסט</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="textSecondary" sx={{mb: 1}}>
                    שמירה בשם שלא קיים תיצור פריסט חדש
                </Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    label="שם פריסט"
                    fullWidth
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">ביטול</Button>
                <Button onClick={() => onSave(value)} color="primary" variant="contained">שמור</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PresetNameDialog;
