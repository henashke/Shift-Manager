import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import {User} from "../../stores/ShiftStore";

interface DeleteUserProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    selectedUser?: User;
    handleConfirm: (userToDeleteId: string) => void;
}

const DeleteUser: React.FC<DeleteUserProps> = ({
    open,
    handleDialogClose,
    handleConfirm,
    selectedUser
}) => (
    <CommonDialog open={open}
                  title={"מחיקת " + (selectedUser ? selectedUser.name : '')}
                  content={<>האם אתה בטוח שברצונך למחוק את {selectedUser?.name}?</>}
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}/>
);

export default DeleteUser;
