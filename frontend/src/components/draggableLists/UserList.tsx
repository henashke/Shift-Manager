import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import usersStore from '../../stores/UsersStore';
import shiftStore, {Shift, User} from '../../stores/ShiftStore';
import DeleteUserDialog from "../dialogs/DeleteUserDialog";
import UserInfoDialog from "../dialogs/UserInfoDialog";
import DraggableList from './DraggableList';
import EditUser from "../dialogs/EditUser";
import authStore from "../../stores/AuthStore";
import notificationStore from "../../stores/NotificationStore";

const UserList: React.FC<{ isDragged?: boolean, setIsDragged?: (val: boolean) => void }> = observer(({ isDragged, setIsDragged }) => {
    const {users} = usersStore;
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
        if (setIsDragged) setIsDragged(false);
    };
    const onDragStart = (e: React.DragEvent, user: User) => {
        e.dataTransfer.setData('application/json', JSON.stringify({user: user}));
    };
    const handleEditDialogOpen = (user: User) => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    const handleInfoDialogOpen = (user: User) => {
        setSelectedUser(user);
        setInfoDialogOpen(true);
    };

    const handleDeleteDialogOpen = (user: User) => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
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
                getKey={u => u.name}
                getLabel={u => u.name}
                onDragStart={onDragStart}
                onDrop={deleteAreaOnDropHandler}
                onItemClick={(user) => handleInfoDialogOpen(user)}
                contextMenuItems={(user) => [
                    {label: 'פרטי משתמש', onClick: () => handleInfoDialogOpen(user)},
                    {label: 'ערוך', onClick: () => handleEditDialogOpen(user)},
                    {label: 'מחק', onClick: () => handleDeleteDialogOpen(user)},
                ]}
                isDragged={isDragged}
            />
            <EditUser open={editDialogOpen}
                       handleDialogClose={handleEditDialogClose}
                       handleConfirm={handleConfirmEdit}
                       user={selectedUser}/>
            <DeleteUserDialog
                open={deleteDialogOpen}
                handleDialogClose={handleDeleteDialogClose}
                handleConfirm={handleConfirmDelete}
                selectedUser={selectedUser}/>
            <UserInfoDialog open={infoDialogOpen} user={selectedUser} onClose={() => setInfoDialogOpen(false)}/>
        </>
    );
});

export default UserList;
