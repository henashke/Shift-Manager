import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import usersStore from '../stores/UsersStore';
import shiftStore, {User, Shift} from '../stores/ShiftStore';
import AddUserDialog from './AddUserDialog';
import DeleteUser from "./dialogs/DeleteUser";
import UserInfoDialog from "./UserInfoDialog";
import DraggableList from './DraggableList';
import {Button} from "@mui/material";
import EditUser from "./dialogs/EditUser";

const UserList: React.FC<{ isDragged?: boolean }> = observer(({ isDragged }) => {
    const {users} = usersStore;
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);

    const deleteAreaOnDropHandler = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {fromShift}: { user: User, fromShift: Shift } = JSON.parse(data);
            if (fromShift) {
                shiftStore.unassignUser(fromShift);
            }
        } catch (e) {
            console.error("Error: " + e);
        }
    };
    const onDragStart = (e: React.DragEvent, user: User, fromShift?: Shift) => {
        e.dataTransfer.setData('application/json', JSON.stringify({user: user, fromShift: fromShift || null}));
    };
    const handleEditDialogOpen = (user: User) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    const handleInfoDialogOpen = (user: User) => {
        setSelectedUser(user);
        setInfoDialogOpen(true);
    };

    const handleDeleteDialogOpen = (user: User) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
    };

    const handleConfirmDelete = () => {
        // Implement delete logic here
        handleDeleteDialogClose();
    };

    const handleConfirmEdit = () => {
        // Implement edit logic here
        handleEditDialogClose();
    };

    return (
        <>
            <DraggableList
                items={users}
                getKey={u => u.id}
                getLabel={u => u.name}
                onDragStart={onDragStart}
                onDrop={deleteAreaOnDropHandler}
                contextMenuItems={(user) => [
                    {label: 'פרטי משתמש', onClick: () => handleInfoDialogOpen(user)},
                    {label: 'ערוך', onClick: () => handleEditDialogOpen(user)},
                    {label: 'מחק', onClick: () => handleDeleteDialogOpen(user)},
                ]}
                isDragged={isDragged}
                renderAddButton={() => (
                    <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)}>
                        הוסף משתמש
                    </Button>
                )}
            />
            <EditUser open={editDialogOpen}
                       handleDialogClose={handleEditDialogClose}
                       handleConfirm={handleConfirmEdit}
                       user={selectedUser}/>
            <DeleteUser
                open={deleteDialogOpen}
                handleDialogClose={handleDeleteDialogClose}
                handleConfirm={handleConfirmDelete}
                selectedUser={selectedUser}/>
            <AddUserDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}/>
            <UserInfoDialog open={infoDialogOpen} user={selectedUser} onClose={() => setInfoDialogOpen(false)}/>
        </>
    );
});

export default UserList;
