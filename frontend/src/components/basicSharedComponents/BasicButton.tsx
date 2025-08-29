import React from 'react';
import {observer} from 'mobx-react-lite';
import {Button} from "@mui/material";

interface AddUserDialogProps {
    onClick: () => void;
    title: string;
    disabled?: boolean;
}

const BasicButton: React.FC<AddUserDialogProps> = observer(({onClick, title, disabled}) => {
    return (
        <Button variant="contained"
                color="primary"
                onClick={onClick}
                disabled={disabled}>
            {title}
        </Button>
    );
});

export default BasicButton;
