import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from './CalendarNavigation';
import DraggableList from './DraggableList';
import {ConstraintType} from './ConstraintTypeList';
import ShiftTable from './ShiftTable';
import {Box, Container, FormControl, MenuItem, Select, Typography} from "@mui/material";
import {sameShift, Shift, User} from '../stores/ShiftStore';
import authStore from "../stores/AuthStore";
import {Constraint, constraintStore} from "../stores/ConstraintStore";
import usersStore from "../stores/UsersStore";

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
            const {fromShift}: {
                userId: string,
                constraintType: ConstraintType,
                fromShift: Shift
            } = JSON.parse(data);
            if (fromShift) {
                constraintStore.removeConstraint(fromShift);
            }
        } catch (e) {
            console.error('Failed to parse data from drag event:', data, e);
        }
    };

    const assignConstraint = (shift: Shift, constraintType: ConstraintType) => {
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
                        unassignHandler={(shift: Shift) => constraintStore.removeConstraint(shift)}
                        getItemName={(item: ConstraintType) => item.toString()}
                        pendingItem={getPendingConstraintTypeFromShift}
                        onDragStartHandler={onAssignedConstraintDragStart}
                        onDragEndHandler={onDragEnd}
                        onDropHandler={handleShiftTableDrop}
                        isPendingItems={constraintStore.pendingConstraints.length > 0}
                        onSave={constraintStore.savePendingConstraints}
                        onCancel={() => {
                            constraintStore.pendingConstraints = [];
                        }}
                        itemName="אילוץ"
            />
            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2}}>
                <FormControl size="small" sx={{minWidth: 160, display: 'flex'}}>
                    <Typography variant="h6">משבץ אילוצים עבור:</Typography>
                    <Select
                        labelId="user-select-label"
                        value={selectedUser}
                        onChange={e => setSelectedUser(e.target.value)}
                    >
                        {usersStore.users.map((user: User) => (
                            <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <DraggableList
                    items={constraintTypes}
                    getKey={item => item}
                    getLabel={item => item}
                    onDragStart={setDragData}
                    onDrop={handleDeleteAreaOnDrop}
                    isDragged={isDragged}
                />
            </Box>
        </Container>
    );
});

export default ConstraintTab;
