import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from '../CalendarNavigation';
import DraggableList from '../DraggableList';
import ShiftTable from '../ShiftTable';
import {Box, Container, FormControl, MenuItem, Select, Typography} from "@mui/material";
import {sameShift, Shift, User} from '../../stores/ShiftStore';
import authStore from "../../stores/AuthStore";
import {Constraint, constraintStore, ConstraintType} from "../../stores/ConstraintStore";
import usersStore from "../../stores/UsersStore";
import notificationStore from "../../stores/NotificationStore";

const constraintTypes = [ConstraintType.CANT, ConstraintType.PREFERS_NOT, ConstraintType.PREFERS];

const ConstraintTab: React.FC = observer(() => {
    const [isDragged, setIsDragged] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>(authStore.username || '');
    useEffect(() => {
        usersStore.fetchUsers();
        constraintStore.fetchConstraint();
    }, []);

    const onAssignedConstraintDragStart = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift) => {
        setIsDragged(true);
        setDragData(e, type, fromShift);
    };

    const setDragData = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            userId: selectedUser,
            constraintType: type,
            fromShift: fromShift || null
        }));
    }

    const onDragEnd = () => {
        setIsDragged(false);
    };

    const handleShiftTableDrop = (e: React.DragEvent, shift: Shift) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {userId, constraintType, fromShift}: {
                userId: string,
                constraintType: ConstraintType,
                fromShift: Shift
            } = JSON.parse(data);
            if (userId && !sameShift(fromShift, shift)) {
                // Check if user is trying to edit their own constraints or is admin
                if (!authStore.isAdmin() && userId !== authStore.username) {
                    notificationStore.showConstraintUnauthorizedError();
                    return;
                }
                assignConstraint(shift, constraintType);
            }
        } catch (error) {
            console.error('Failed to parse data from drag event:', data, error);
        }
    };

    const handleDeleteAreaOnDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {userId, fromShift}: {
                userId: string,
                constraintType: ConstraintType,
                fromShift: Shift
            } = JSON.parse(data);
            if (fromShift) {
                // Check if user is trying to edit their own constraints or is admin
                if (!authStore.isAdmin() && userId !== authStore.username) {
                    notificationStore.showConstraintUnauthorizedError();
                    return;
                }
                constraintStore.removeConstraint(fromShift, userId);
            }
        } catch (e) {
            console.error('Failed to parse data from drag event:', data, e);
        }
    };

    const assignConstraint = (shift: Shift, constraintType: ConstraintType) => {
        // Check if user is trying to edit their own constraints or is admin
        if (!authStore.isAdmin() && selectedUser !== authStore.username) {
            notificationStore.showConstraintUnauthorizedError();
            return;
        }
        constraintStore.addConstraintPending({
            constraintType: constraintType,
            shift: shift,
            userId: selectedUser
        });
    }

    const retrieveConstraintFromShift = (shift: Shift): ConstraintType | undefined => {
        return constraintStore.constraints.find(c => c.userId === selectedUser && sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift))?.constraintType;
    };

    const createAllConstraintsArray = () => {
        return constraintStore.constraints
            .map((c: Constraint) => ({type: c.shift.type, date: c.shift.date}))
            .concat(constraintStore.pendingConstraints
                .map((c: Constraint) => ({type: c.shift.type, date: c.shift.date})))
    }

    const getPendingConstraintTypeFromShift = (shift: Shift): ConstraintType | undefined => {
        return constraintStore.pendingConstraints.find(c => c.userId === selectedUser && sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift))?.constraintType;
    }

    return (
        <Container maxWidth={"xl"} dir="rtl">
            <CalendarNavigation/>
            <ShiftTable itemList={constraintTypes}
                        assignedShifts={createAllConstraintsArray()}
                        retrieveItemFromShift={retrieveConstraintFromShift}
                        assignHandler={assignConstraint}
                        unassignHandler={(shift: Shift) => {
                            // Check if user is trying to edit their own constraints or is admin
                            if (!authStore.isAdmin() && selectedUser !== authStore.username) {
                                notificationStore.showConstraintUnauthorizedError();
                                return;
                            }
                            constraintStore.removeConstraint(shift, selectedUser);
                        }}
                        getItemName={(item: ConstraintType) => item.toString()}
                        retrievePendingItem={getPendingConstraintTypeFromShift}
                        onDragStartHandler={onAssignedConstraintDragStart}
                        onDragEndHandler={onDragEnd}
                        onDropHandler={handleShiftTableDrop}
                        isPendingItems={constraintStore.pendingConstraints.length > 0}
                        onSave={constraintStore.savePendingConstraints}
                        onCancel={() => {
                            constraintStore.pendingConstraints = [];
                        }}
                        itemName="אילוץ"
                        requireAdmin={false}
            />
            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2}}>
                {/*<FormControl size="small" sx={{minWidth: 160, display: 'flex'}}>*/}
                {/*<Typography variant="h6">משבץ אילוצים עבור:</Typography>*/}
                {/*    <Select*/}
                {/*        labelId="user-select-label"*/}
                {/*        value={selectedUser}*/}
                {/*        onChange={e => setSelectedUser(e.target.value)}*/}
                {/*    >*/}
                {/*        {usersStore.users.map((user: User) => (*/}
                {/*            <MenuItem key={user.name} value={user.name}>{user.name}</MenuItem>*/}
                {/*        ))}*/}
                {/*    </Select>*/}
                {/*</FormControl>*/}
                {/*{!authStore.isAdmin() && selectedUser !== authStore.username && (*/}
                {/*    <Typography variant="body2" color="warning.main" sx={{fontStyle: 'italic'}}>*/}
                {/*        (רק צפייה - לא ניתן לערוך אילוצים של כונן אחר)*/}
                {/*    </Typography>*/}
                {/*)}*/}
                <DraggableList
                    items={constraintTypes}
                    getKey={item => item}
                    getLabel={item => item}
                    onDragStart={setDragData}
                    onDrop={handleDeleteAreaOnDrop}
                    isDragged={isDragged}
                    renderAddButton={
                        <>
                            <FormControl size="small" sx={{minWidth: 160, display: 'flex'}}>
                                <Typography variant="h6">משבץ אילוצים עבור:</Typography>
                                <Select
                                    labelId="user-select-label"
                                    value={selectedUser}
                                    onChange={e => setSelectedUser(e.target.value)}
                                >
                                    {usersStore.users.map((user: User) => (
                                        <MenuItem key={user.name} value={user.name}>{user.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {!authStore.isAdmin() && selectedUser !== authStore.username && (
                                <Typography variant="body2" color="warning.main" sx={{fontStyle: 'italic'}}>
                                    (רק צפייה - לא ניתן לערוך אילוצים של כונן אחר)
                                </Typography>
                            )}
                        </>
                    }
                />
            </Box>
        </Container>
    );
});

export default ConstraintTab;
