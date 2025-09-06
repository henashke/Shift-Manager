import React, {useState} from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import usersStore from "../../stores/UsersStore";
import {TextField, Typography} from "@mui/material";

interface EditUserProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    username?: string;
}

const EditUser: React.FC<EditUserProps> = ({
                                               open,
                                               handleDialogClose,
                                               username
                                           }) => {
    const user = usersStore.users.find(u => u.name === username)
    const [newScore, setNewScore] = useState(user?.score?.toString() ?? '0');

    const handleConfirmEdit = () => {
        if (user) {
            usersStore.editUser({...user, score: Number(newScore)});
        }
        handleDialogClose();
    };

    return (
        <CommonDialog open={open}
                      title={"עריכת משתמש " + user?.name}
                      content={
                          <>
                              <Typography variant="body1" gutterBottom>
                                  {'ניקוד'}
                              </Typography>
                              <TextField
                                  defaultValue={user?.score?.toString() ?? '0'}
                                  type="number"
                                  onChange={(e) => setNewScore(e.target.value)}
                                  fullWidth
                              />
                          </>
                      }
                      handleConfirm={handleConfirmEdit}
                      handleDialogClose={handleDialogClose}/>
    );
}

export default EditUser;
