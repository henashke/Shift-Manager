import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import {Checkbox, List, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import {User} from "../../stores/ShiftStore";

interface DeleteUserProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    handleConfirm: (userToDeleteId: string) => void;
    handleUserToggle: (userId: string) => void;
    selectedUserIds: string[];
    users: User[];
}

const SuggestAssignmentsDialog: React.FC<DeleteUserProps> = ({
                                                                 open,
                                                                 handleDialogClose,
                                                                 handleConfirm,
                                                                 handleUserToggle,
                                                                 selectedUserIds,
                                                                 users
                                                             }) => {

    return (
        <CommonDialog open={open}
                      title={"בחר משתמשים רלוונטיים לשיבוץ הקרוב"}
                      content={<List>
                          {users.map(user => (
                              <ListItem key={user.name} onClick={() => handleUserToggle(user.name)} component={
                                  'div'
                              }>
                                  <ListItemIcon>
                                      <Checkbox
                                          edge="start"
                                          checked={selectedUserIds.includes(user.name)}
                                          tabIndex={-1}
                                          disableRipple
                                      />
                                  </ListItemIcon>
                                  <ListItemText primary={user.name}/>
                              </ListItem>
                          ))}
                      </List>}
                      handleConfirm={handleConfirm}
                      handleDialogClose={handleDialogClose}
                      warningDialog/>
    );
}

export default SuggestAssignmentsDialog;
