import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import {User} from "../../stores/ShiftStore";

interface EditUserProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    handleConfirm: (user: User) => void;
    user?: User;
}

const EditUser: React.FC<EditUserProps> = ({
    open,
    handleDialogClose,
    handleConfirm,
    user
}) => (
    <CommonDialog open={open}
                  title={"עריכת משתמש " + user?.name}
                  content={<>עריכת משתמש (מימוש בהמשך)</>}
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}/>
);

export default EditUser;
