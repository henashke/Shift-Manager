import React, {useState} from 'react';
import CalendarNavigation from './CalendarNavigation';
import ShiftTable from './ShiftTable';
import UserList from './UserList';
import {Container} from "@mui/material";
import usersStore from "../stores/UsersStore";
import shiftStore, {sameShift, Shift, User} from "../stores/ShiftStore";
import {observer} from 'mobx-react-lite';

const AssignmentTab: React.FC = observer(() => {
    const { users } = usersStore;
    const [isDragged, setIsDragged] = useState(false);


    const onDragStart = (e: React.DragEvent, user: User, fromShift?: Shift) => {
        setIsDragged(true);
        e.dataTransfer.setData('application/json', JSON.stringify({ user: user, fromShift: fromShift || null }));
    };

    const onDragEnd = () => {
        setIsDragged(false);
    };

    const handleDrop = (e: React.DragEvent, shift: Shift) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const { user, fromShift }: { user: User, fromShift: Shift } = JSON.parse(data);
            if (user && !sameShift(fromShift, shift)) {
                shiftStore.assignShiftPending({ ...shift, userId: user.id });
            }
        } catch (e) {
            console.error("Failed to parse data from drag event:", data, e);
        }
    };

    const getUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => shiftStore.getAssignedShift(shift)?.userId === u.id);
    }

    const getPendingUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => u.id === shiftStore.pendingAssignedShifts.find(assignedShift => sameShift(assignedShift, shift))?.userId)
    }


    return (
        <Container maxWidth={"xl"} dir={"rtl"}>
            <CalendarNavigation/>
            <ShiftTable onDropHandler={handleDrop}
                        onDragStartHandler={onDragStart}
                        onDragEndHandler={onDragEnd}
                        assignHandler={(shift, user) => shiftStore.assignShiftPending({ ...shift, userId: user.id })}
                        unassignHandler={shift => shiftStore.unassignUser(shift)}
                        pendingItem={getPendingUserFromShift}
                        retrieveItemFromShift={getUserFromShift}
                        getItemName={u => u.name}
                        itemList={users}
                        assignedShifts={shiftStore.pendingAssignedShifts.concat(shiftStore.assignedShifts)}
                        isPendingItems={shiftStore.pendingAssignedShifts.length > 0}
                        onSave={shiftStore.savePendingAssignments}
                        onCancel={() => {
                            shiftStore.pendingAssignedShifts = [];
                        }}
            />
            <UserList isDragged={isDragged}/>
        </Container>
    );
});

export default AssignmentTab;
