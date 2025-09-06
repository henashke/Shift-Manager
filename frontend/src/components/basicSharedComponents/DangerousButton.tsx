import React from 'react';
import {observer} from 'mobx-react-lite';
import {Button} from "@mui/material";

interface AddUserDialogProps {
    onClick: () => void;
    title: string;
}

const DangerousButton: React.FC<AddUserDialogProps> = observer(({onClick, title}) => {
    return (
        <Button variant="contained" color="error" onClick={onClick}>{title}</Button>
    );
});

export default DangerousButton;
