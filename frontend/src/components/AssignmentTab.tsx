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
    ListItemText,
    Box,
    Snackbar,
    Alert
} from "@mui/material";
import usersStore from "../stores/UsersStore";
import {observer} from 'mobx-react-lite';
import shiftStore, {sameShift, Shift, User} from "../stores/ShiftStore";

const AssignmentTab: React.FC = observer(() => {
    const {users} = usersStore;
    const [isDragged, setIsDragged] = useState(false);
    const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState(false);

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

    const handleResetOpen = () => setResetDialogOpen(true);
    const handleResetClose = () => setResetDialogOpen(false);
    const handleResetConfirm = async () => {
        setResetLoading(true);
        setResetError(false);
        const result = await shiftStore.resetWeeklyShifts();
        if (result === 'success') {
            setResetSuccess(true);
        } else {
            setResetError(true);
        }
        setResetLoading(false);
        setResetDialogOpen(false);
    };

    return (
        <Container maxWidth={"xl"} dir={"rtl"}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button variant="contained" color="secondary" onClick={handleSuggestOpen}>
                    הצע שיבוץ משמרות
                </Button>
                <Button variant="outlined" color="error" onClick={handleResetOpen}>
                    אתחל משמרות השבוע
                </Button>
            </Box>
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
            <Dialog open={resetDialogOpen} onClose={handleResetClose}>
                <DialogTitle>אישור איפוס</DialogTitle>
                <DialogContent>האם אתה בטוח שברצונך לאפס את כל המשמרות של השבוע הנוכחי?</DialogContent>
                <DialogActions>
                    <Button onClick={handleResetClose} disabled={resetLoading}>ביטול</Button>
                    <Button onClick={handleResetConfirm} color="error" variant="contained" disabled={resetLoading}>
                        {resetLoading ? 'מאפס...' : 'אשר' }
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={resetSuccess} autoHideDuration={3000} onClose={() => setResetSuccess(false)}>
                <Alert severity="success" sx={{ width: '100%' }}>כל המשמרות של השבוע אופסו בהצלחה</Alert>
            </Snackbar>
            <Snackbar open={resetError} autoHideDuration={3000} onClose={() => setResetError(false)}>
                <Alert severity="error" sx={{ width: '100%' }}>אירעה שגיאה בעת איפוס המשמרות</Alert>
            </Snackbar>
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
