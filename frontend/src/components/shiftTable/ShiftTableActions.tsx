import React from 'react';
import {Box, Button, Grow, Paper, Typography} from '@mui/material';
import authStore from '../../stores/AuthStore';
import notificationStore from '../../stores/NotificationStore';

interface ShiftTableActionsProps {
    onSave: () => void;
    onCancel: () => void;
    requireAdmin?: boolean;
}

const ColorIndicators = () => (
    <Box sx={{display: 'flex', alignItems: 'flex-start', mt: 0.5, gap: 1, flexDirection: 'column'}}>
        <Box sx={{display: 'flex', gap: 1}}>
            <Box sx={{
                width: 18,
                height: 18,
                bgcolor: 'primary.main',
                borderRadius: 1,
                mr: 0.5,
                border: '1px solid',
                borderColor: 'primary.dark'
            }}/>
            <Typography variant="caption">משובץ</Typography>
        </Box>
        <Box sx={{display: 'flex', gap: 1}}>
            <Box sx={{
                width: 18,
                height: 18,
                bgcolor: 'secondary.main',
                borderRadius: 1,
                mr: 0.5,
                border: '1px solid',
                borderColor: 'secondary.dark'
            }}/>
            <Typography variant="caption">ממתין לשמירה</Typography>
        </Box>
    </Box>
);

const ShiftTableActions: React.FC<ShiftTableActionsProps> = ({onSave, onCancel, requireAdmin = true}) => {
    const handleSave = () => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        onSave();
    };

    const handleCancel = () => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        onCancel();
    };

    return (
        <Grow in timeout={700} style={{ transformOrigin: 'left center' }}>
            <Paper sx={{p: 2, flex: 1, borderRadius: 3}}>
                <Box sx={{display: "flex", alignItems: 'center', mb: 1}}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        sx={{ml: 1}}
                    >
                        שמור
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleCancel}
                    >
                        בטל
                    </Button>
                </Box>
                <ColorIndicators/>
            </Paper>
        </Grow>
    );
};

export default ShiftTableActions;
