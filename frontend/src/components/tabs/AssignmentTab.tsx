import React, {useEffect, useState} from 'react';
import CalendarNavigation from '../CalendarNavigation';
import ShiftTable from '../ShiftTable';
import UserList from '../UserList';
import {Alert, Box, Container, Snackbar} from "@mui/material";
import usersStore from "../../stores/UsersStore";
import {observer} from 'mobx-react-lite';
import shiftStore, {AssignedShift, sameShift, Shift, User} from "../../stores/ShiftStore";
import authStore from "../../stores/AuthStore";
import notificationStore from "../../stores/NotificationStore";
import shiftWeightStore from "../../stores/ShiftWeightStore";
import ChangeAssignedShiftPresetDialog from '../dialogs/ChangeAssignedShiftPresetDialog';
import {SwapHoriz} from '@mui/icons-material';
import DangerousButton from "../basicSharedComponents/DangerousButton";
import BasicButton from "../basicSharedComponents/BasicButton";
import ResetWeeklyShiftsDialog from "../dialogs/ResetWeeklyShiftsDialog";
import SuggestAssignmentsDialog from "../dialogs/SuggestAssignmentsDialog";

const AssignmentTab: React.FC = observer(() => {
    const {users} = usersStore;
    const [isDragged, setIsDragged] = useState(false);
    const [isChangePresetDialogOpen, setIsChangePresetDialogOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<AssignedShift | undefined>(undefined);
    const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState(false);

    useEffect(() => {
        shiftWeightStore.fetchPresets();
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
                assignHandler(shift, user);
            }
        } catch (e) {
            console.error("Failed to parse data from drag event:", data, e);
        }
    };

    const assignHandler = (shift: Shift, user: User) => {
        shiftStore.assignShiftPending({
            ...shift,
            assignedUsername: user.name,
            preset: shiftWeightStore.currentPresetObject
        });
    }

    const getUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => shiftStore.getAssignedShift(shift)?.assignedUsername === u.name);
    }

    const getPendingUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => u.name === shiftStore.pendingAssignedShifts.find(assignedShift => sameShift(assignedShift, shift))?.assignedUsername)
    }

    const handleSuggestOpen = () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setSuggestDialogOpen(true);
    };
    const handleSuggestClose = () => setSuggestDialogOpen(false);
    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };
    const handleSuggestConfirm = async () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        const weekDates = shiftStore.weekDates;
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        await shiftStore.suggestShiftAssignments(selectedUserIds, startDate, endDate);
        setSuggestDialogOpen(false);
    };

    const handleResetOpen = () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setResetDialogOpen(true);
    };
    const handleResetClose = () => setResetDialogOpen(false);
    const handleResetConfirm = async () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setResetError(false);
        const result = await shiftStore.resetWeeklyShifts();
        if (result === 'success') {
            setResetSuccess(true);
        } else {
            setResetError(true);
        }
        setResetDialogOpen(false);
    };

    const getItemName = (user: User, shift?: Shift) => {
        if (!shift || !shiftStore.getAssignedShift(shift)) return user.name;
        return user.name + ' (' + shiftStore.getAssignedOrPendingShift(shift)?.preset?.name + ')'
    }

    return (
        <Container maxWidth={"xl"} dir={"rtl"}>
            <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                <BasicButton onClick={handleSuggestOpen} title={"הצע שיבוץ משמרות"}/>
                <DangerousButton title={"אתחל משמרות השבוע"} onClick={handleResetOpen}/>
            </Box>
            <CalendarNavigation/>
            <ShiftTable onDropHandler={handleDrop}
                        onDragStartHandler={onDragStart}
                        onDragEndHandler={onDragEnd}
                        assignHandler={assignHandler}
                        unassignHandler={shift => shiftStore.unassignUser(shift)}
                        retrievePendingItem={getPendingUserFromShift}
                        retrieveItemFromShift={getUserFromShift}
                        getItemName={getItemName}
                        itemList={users}
                        assignedShifts={shiftStore.pendingAssignedShifts.concat(shiftStore.assignedShifts)}
                        isPendingItems={shiftStore.pendingAssignedShifts.length > 0}
                        onSave={shiftStore.savePendingAssignments}
                        onCancel={() => shiftStore.pendingAssignedShifts = []}
                        itemName="כונן"
                        additionalContextMenuItems={[{
                            label: 'שנה פריסט עבור המשמרת',
                            action: (shift: Shift) => {
                                setSelectedShift(shiftStore.getAssignedShift(shift));
                                setIsChangePresetDialogOpen(true);
                            },
                            icon: <SwapHoriz/>
                        }]}
            />
            <SuggestAssignmentsDialog handleConfirm={handleSuggestConfirm}
                                      open={suggestDialogOpen}
                                      handleDialogClose={handleSuggestClose}
                                      selectedUserIds={selectedUserIds}
                                      handleUserToggle={handleUserToggle}
                                      users={users}/>
            <ResetWeeklyShiftsDialog handleConfirm={handleResetConfirm} open={resetDialogOpen}
                                     handleDialogClose={handleResetClose}/>
            <Snackbar open={resetSuccess} autoHideDuration={3000} onClose={() => setResetSuccess(false)}>
                <Alert severity="success" sx={{width: '100%'}}>כל המשמרות של השבוע אופסו בהצלחה</Alert>
            </Snackbar>
            <Snackbar open={resetError} autoHideDuration={3000} onClose={() => setResetError(false)}>
                <Alert severity="error" sx={{width: '100%'}}>אירעה שגיאה בעת איפוס המשמרות</Alert>
            </Snackbar>
            <ChangeAssignedShiftPresetDialog open={isChangePresetDialogOpen}
                                             onClose={() => setIsChangePresetDialogOpen(false)}
                                             assignedShift={selectedShift ?? {
                                           assignedUsername: '',
                                           date: new Date(),
                                           type: 'יום',
                                           preset: {name: '', weights: []}
                                       }}
            />
            <UserList isDragged={isDragged} setIsDragged={setIsDragged}/>
        </Container>
    );
});

export default AssignmentTab;
