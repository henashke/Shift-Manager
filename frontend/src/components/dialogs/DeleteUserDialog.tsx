import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import usersStore from "../../stores/UsersStore";

interface DeleteUserProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    selectedUsername?: string;
    handleConfirm: (userToDeleteId: string) => void;
}

const DeleteUserDialog: React.FC<DeleteUserProps> = ({
                                                         open,
                                                         handleDialogClose,
                                                         handleConfirm,
                                                         selectedUsername
                                                     }) => {
    const user = usersStore.users.find(u => u.name === selectedUsername);

    return (
        <CommonDialog open={open}
                      title={"מחיקת " + (user ? user.name : '')}
                      content={<>האם אתה בטוח שברצונך למחוק את {user?.name}?</>}
                      handleConfirm={handleConfirm}
                      handleDialogClose={handleDialogClose}
                      warningDialog/>
    );
}

export default DeleteUserDialog;
