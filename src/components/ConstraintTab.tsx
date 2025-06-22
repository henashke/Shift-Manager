import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from './CalendarNavigation';
import DraggableList from './DraggableList';
import {ConstraintType} from './ConstraintTypeList';
import ShiftTable from './ShiftTable';
import {Container} from "@mui/material";
import {sameShift, Shift} from '../stores/ShiftStore';
import authStore from "../stores/AuthStore";
import {Constraint, constraintStore} from "../stores/ConstraintStore";

const constraintTypes = [ConstraintType.CANT, ConstraintType.PREFERS_NOT, ConstraintType.PREFERS];

const ConstraintTab: React.FC = observer(() => {
    const [isDragged, setIsDragged] = useState(false);

    const onAssignedConstraintDragStart = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift) => {
        setIsDragged(true);
        setDragData(e, type, fromShift);
    };

    const setDragData = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            userId: authStore.username,
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
                constraintStore.addConstraint({
                    userId: userId,
                    shift: shift,
                    constraintType: constraintType
                });
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
        constraintStore.addConstraint({
            constraintType: constraintType,
            shift: shift,
            userId: authStore.username!
        });
    }

    const retreiveConstraintFromShift = (shift: Shift): ConstraintType | undefined => {
        return constraintStore.constraints.find(c => c.userId === authStore.username && sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift))?.constraintType;
    };

    return (
        <Container maxWidth="lg" dir="rtl">
            <CalendarNavigation/>
            <ShiftTable itemList={constraintTypes}
                        assignedShifts={constraintStore.constraints.map((c: Constraint) => ({type: c.shift.type, date: c.shift.date}))}
                        retrieveItemFromShift={retreiveConstraintFromShift}
                        assignHandler={assignConstraint}
                        unassignHandler={(shift: Shift) => constraintStore.removeConstraint(shift)}
                        getItemName={(item: ConstraintType) => item.toString()}
                        onDragStartHandler={onAssignedConstraintDragStart}
                        onDragEndHandler={onDragEnd}
                        onDropHandler={handleShiftTableDrop}/>
            <DraggableList
                items={constraintTypes}
                getKey={item => item}
                getLabel={item => item}
                onDragStart={setDragData}
                onDrop={handleDeleteAreaOnDrop}
                isDragged={isDragged}
            />
        </Container>
    );
});

export default ConstraintTab;
