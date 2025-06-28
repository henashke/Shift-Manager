import React, {useEffect, useState} from 'react';
import CalendarNavigation from './CalendarNavigation';
import ShiftTable from './ShiftTable';
import UserList from './UserList';
import {
    Button,
    Checkbox,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from "@mui/material";
import usersStore from "../stores/UsersStore";
import {observer} from 'mobx-react-lite';
import shiftStore, {sameShift, Shift, User} from "../stores/ShiftStore";

const AssignmentTab: React.FC = observer(() => {
    const {users} = usersStore;
    const [isDragged, setIsDragged] = useState(false);
    const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    useEffect(() => {
        usersStore.fetchUsers();
        shiftStore.fetchShifts();
    }, []);

    useEffect(() => {
        setSelectedUserIds(users.map(u => u.name));
    }, [users]);

    const onDragStart = (e: React.DragEvent, user: User, fromShift?: Shift) => {
        setIsDragged(true);
        e.dataTransfer.setData('application/json', JSON.stringify({user: user, fromShift: fromShift || null}));
    };

    const onDragEnd = () => {
        setIsDragged(false);
    };

    const handleDrop = (e: React.DragEvent, shift: Shift) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {user, fromShift}: { user: User, fromShift: Shift } = JSON.parse(data);
            if (user && !sameShift(fromShift, shift)) {
                shiftStore.assignShiftPending({...shift, assignedUsername: user.name});
            }
        } catch (e) {
            console.error("Failed to parse data from drag event:", data, e);
        }
    };

    console.log("Assigned Shifts:", shiftStore.assignedShifts.length);
    console.log("pendingAssignedShifts:", shiftStore.pendingAssignedShifts.length);

    const getUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => shiftStore.getAssignedShift(shift)?.assignedUsername === u.name);
    }

    const getPendingUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => u.name === shiftStore.pendingAssignedShifts.find(assignedShift => sameShift(assignedShift, shift))?.assignedUsername)
    }

    const handleSuggestOpen = () => setSuggestDialogOpen(true);
    const handleSuggestClose = () => setSuggestDialogOpen(false);
    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };
    const handleSuggestConfirm = async () => {
        const weekDates = shiftStore.weekDates;
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        await shiftStore.suggestShiftAssignments(selectedUserIds, startDate, endDate);
        setSuggestDialogOpen(false);
    };

    return (
        <Container maxWidth={"xl"} dir={"rtl"}>
            <Button variant="contained" color="secondary" sx={{mb: 2}} onClick={handleSuggestOpen}>
                הצע שיבוץ משמרות
            </Button>
            <Dialog open={suggestDialogOpen} onClose={handleSuggestClose}>
                <DialogTitle>בחר משתמשים רלוונטיים לשיבוץ הקרוב</DialogTitle>
                <DialogContent>
                    <List>
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
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSuggestClose}>ביטול</Button>
                    <Button onClick={handleSuggestConfirm} variant="contained" color="primary"
                            disabled={selectedUserIds.length === 0}>
                        הצע שיבוץ
                    </Button>
                </DialogActions>
            </Dialog>
            <CalendarNavigation/>
            <ShiftTable onDropHandler={handleDrop}
                        onDragStartHandler={onDragStart}
                        onDragEndHandler={onDragEnd}
                        assignHandler={(shift, user) => shiftStore.assignShiftPending({
                            ...shift,
                            assignedUsername: user.name
                        })}
                        unassignHandler={shift => shiftStore.unassignUser(shift)}
                        pendingItem={getPendingUserFromShift}
                        retrieveItemFromShift={getUserFromShift}
                        getItemName={u => u.name}
                        itemList={users}
                        assignedShifts={shiftStore.pendingAssignedShifts.concat(shiftStore.assignedShifts)}
                        isPendingItems={shiftStore.pendingAssignedShifts.length > 0}
                        onSave={shiftStore.savePendingAssignments}
                        onCancel={() => shiftStore.pendingAssignedShifts = []}
                        itemName="שיבוץ"
            />
            <UserList isDragged={isDragged}/>
        </Container>
    );
});

export default AssignmentTab;
