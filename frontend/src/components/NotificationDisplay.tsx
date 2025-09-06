import React from 'react';
import {Alert, Snackbar} from '@mui/material';
import {observer} from 'mobx-react-lite';
import notificationStore from '../stores/NotificationStore';

const NotificationDisplay: React.FC = observer(() => {
    const handleClose = (id: string) => {
        notificationStore.removeNotification(id);
    };

    return (
        <>
            {notificationStore.notifications.map((notification) => (
                <Snackbar
                    key={notification.id}
                    open={true}
                    autoHideDuration={notification.duration || 5000}
                    onClose={() => handleClose(notification.id)}
                    anchorOrigin={{vertical: 'top', horizontal: 'center'}}
                >
                    <Alert
                        severity={notification.type}
                        sx={{width: '100%', direction: 'rtl'}}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            ))}
        </>
    );
});

export default NotificationDisplay; 