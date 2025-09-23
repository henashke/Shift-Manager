import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from '../shiftTable/CalendarNavigation';
import DraggableList from '../draggableLists/DraggableList';
import ShiftTable, {stringToColor} from '../shiftTable/ShiftTable';
import {Box, Container, Typography} from "@mui/material";
import {sameShift, Shift} from '../../stores/ShiftStore';
import authStore from "../../stores/AuthStore";
import {Constraint, constraintStore, ConstraintType} from "../../stores/ConstraintStore";
import usersStore from "../../stores/UsersStore";
import notificationStore from "../../stores/NotificationStore";
import NativeSelect from "../basicSharedComponents/NativeSelect";

const constraintTypes = [ConstraintType.CANT, ConstraintType.PREFERS_NOT, ConstraintType.PREFERS];

const ConstraintTab: React.FC = observer(() => {
    const [isDragged, setIsDragged] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>(authStore.username || '');
    useEffect(() => {
        usersStore.fetchUsers();
        constraintStore.fetchConstraint();
    }, []);

    const onAssignedConstraintDragStart = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift, username?: string) => {
        requestAnimationFrame(() => setIsDragged(true));
        setDragData(e, type, fromShift, username);
    };

    const setDragData = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift, username?: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            userId: username ?? selectedUser,
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
        setIsDragged(false);
    };

    const assignConstraint = (shift: Shift, constraintType: ConstraintType) => {
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

    const retrieveConstraintFromShift = (shift: Shift): Constraint | undefined => {
        return constraintStore.constraints.find(c => (selectedUser === 'admin' || c.userId === selectedUser) && sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift));
    };

    const retrieveConstraintsFromShift = (shift: Shift, username?: string): Constraint[] => {
        return constraintStore.constraints.concat(constraintStore.pendingConstraints).filter(c => (username === 'admin' || c.userId === username) && sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift));
    }

    const retrieveConstraintTypeFromShift = (shift: Shift): ConstraintType | undefined => {
        return retrieveConstraintFromShift(shift)?.constraintType;
    };

    const getPendingConstraintTypeFromShift = (shift: Shift): ConstraintType | undefined => {
        return getPendingConstraintFromShift(shift)?.constraintType;
    }

    const getPendingConstraintFromShift = (shift: Shift): Constraint | undefined => {
        return constraintStore.pendingConstraints.find(c => c.userId === selectedUser && sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift));
    }

    const isRemoveItemDisabled = (shift: Shift) => !constraintStore.constraints.concat(constraintStore.pendingConstraints).find(c => c.userId === selectedUser && sameShift(c.shift, shift))

    const getConstraintElement = (constraintType: ConstraintType, shift: Shift) => {
        const allConstraintsOfShift = retrieveConstraintsFromShift(shift, selectedUser);
        if (allConstraintsOfShift.length === 0) return <></>;
        return <Box
            sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1}}
        >
            {allConstraintsOfShift.map(c =>
                <Box sx={{
                    background: theme => c.isPending ? theme.palette.secondary.main : stringToColor(c.userId),
                    color: 'common.white',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}
                     onDragStart={e => onAssignedConstraintDragStart(e, constraintType, shift, c.userId)}
                     onDragEnd={onDragEnd} draggable
                >
                    {c.userId + ': ' + constraintType}
                </Box>
            )
            }
        </Box>
    }

    const selectedUserOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.target.value === '' ? setSelectedUser(authStore.username ?? '') : setSelectedUser(e.target.value)
    }

    const getUsernames = () => {
        return usersStore.users.filter(u => authStore.isAdmin() || u.name === authStore.username).map(u => u.name);
    }

    return (
        <Container maxWidth={"xl"} dir="rtl">
            <CalendarNavigation/>
            <ShiftTable itemList={constraintTypes}
                        defaultItem={ConstraintType.CANT}
                        retrieveItemFromShift={retrieveConstraintTypeFromShift}
                        assignHandler={assignConstraint}
                        unassignHandler={(shift: Shift) => {
                            if (!authStore.isAdmin() && selectedUser !== authStore.username) {
                                notificationStore.showConstraintUnauthorizedError();
                                return;
                            }
                            constraintStore.removeConstraint(shift, selectedUser);
                        }}
                        getItemName={(item: ConstraintType) => item.toString()}
                        retrievePendingItem={getPendingConstraintTypeFromShift}
                        onDropHandler={handleShiftTableDrop}
                        isPendingItems={constraintStore.pendingConstraints.length > 0}
                        onSave={constraintStore.savePendingConstraints}
                        onCancel={() => {
                            constraintStore.pendingConstraints = [];
                        }}
                        itemName="אילוץ"
                        requireAdmin={false}
                        isRemoveItemDisabled={isRemoveItemDisabled}
                        getItemElement={getConstraintElement}
            />
            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2}}>
                <DraggableList
                    items={constraintTypes}
                    getKey={item => item}
                    getLabel={item => item}
                    onDragStart={setDragData}
                    onDrop={handleDeleteAreaOnDrop}
                    isDragged={isDragged}
                    renderAdditionalComponent={
                        <>
                            <Typography variant="h6">משבץ אילוצים עבור:</Typography>
                            <NativeSelect title={""}
                                          options={getUsernames()}
                                          onChange={selectedUserOnChange} hideTitleElement={!authStore.isAdmin()}/>
                        </>
                    }
                />
            </Box>
        </Container>
    );
});

export default ConstraintTab;
