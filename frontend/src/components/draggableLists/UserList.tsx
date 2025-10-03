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
    const [selectedUserName, setSelectedUserName] = useState<string | undefined>(undefined);
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
        setSelectedUserName(user.name);
        setEditDialogOpen(true);
    };

    const handleInfoDialogOpen = (user: User) => {
        setSelectedUserName(user.name);
        setInfoDialogOpen(true);
    };

    const handleDeleteDialogOpen = (user: User) => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setSelectedUserName(user.name);
        setDeleteDialogOpen(true);
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUserName) {
            handleDeleteDialogClose();
            return;
        }
        try {
            await usersStore.deleteUser(selectedUserName);
            notificationStore.showSuccess('המשתמש נמחק בהצלחה');
        } catch (e) {
            notificationStore.showError('מחיקת המשתמש נכשלה');
        } finally {
            handleDeleteDialogClose();
            setSelectedUserName(undefined);
        }
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
                colorful
            />
            <EditUser open={editDialogOpen}
                       handleDialogClose={handleEditDialogClose}
                      username={selectedUserName}/>
            <DeleteUserDialog
                open={deleteDialogOpen}
                handleDialogClose={handleDeleteDialogClose}
                handleConfirm={handleConfirmDelete}
                selectedUsername={selectedUserName}/>
            <UserInfoDialog open={infoDialogOpen} username={selectedUserName} onClose={() => setInfoDialogOpen(false)}/>
        </>
    );
});

export default UserList;
