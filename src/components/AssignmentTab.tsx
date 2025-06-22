import React, { useState } from 'react';
import CalendarNavigation from './CalendarNavigation';
import ShiftTable from './ShiftTable';
import UserList from './UserList';
import {Container} from "@mui/material";
import usersStore from "../stores/UsersStore";
import shiftStore, {sameShift, Shift, User} from "../stores/ShiftStore";

const AssignmentTab: React.FC = () => {
    const { assignUser } = shiftStore;
    const { users } = usersStore;
    const [isDragged, setIsDragged] = useState(false);


    const onDragStart = (e: React.DragEvent, user: User, fromShift?: Shift) => {
        setIsDragged(true);
        e.dataTransfer.setData('application/json', JSON.stringify({ user: user, fromShift: fromShift || null }));
    };

    const onDragEnd = () => {
        console.log("Drag ended");
        setIsDragged(false);
    };

    const handleDrop = (e: React.DragEvent, shift: Shift) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const { user, fromShift }: { user: User, fromShift: Shift } = JSON.parse(data);
            if (user && !sameShift(fromShift, shift)) {
                assignUser(shift, user.id);
            }
        } catch (e) {
            console.error("Failed to parse data from drag event:", data, e);
        }
    };

    const getUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => shiftStore.getAssignedShift(shift)?.userId === u.id);
    }

    return (
        <Container maxWidth={"lg"} dir={"rtl"}>
            <CalendarNavigation/>
            <ShiftTable onDropHandler={handleDrop}
                        onDragStartHandler={onDragStart}
                        onDragEndHandler={onDragEnd}
                        assignHandler={(shift, user) => assignUser(shift, user.id)}
                        retrieveItemFromShift={getUserFromShift}
                        getItemName={(user: User) => (user.name)}
                        itemList={users}/>
            <UserList isDragged={isDragged}/>
        </Container>
    );
};

export default AssignmentTab;
