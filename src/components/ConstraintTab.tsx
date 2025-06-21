import React from 'react';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from './CalendarNavigation';
import DraggableList from './DraggableList';
import {ConstraintType} from './ConstraintTypeList';
import ShiftTable from './ShiftTable';
import {Container} from "@mui/material";
import {sameShift, Shift} from '../stores/ShiftStore';
import authStore from "../stores/AuthStore";
import {constraintStore} from "../stores/ConstraintStore";

const constraintTypes = [ConstraintType.CANT, ConstraintType.PREFERS_NOT, ConstraintType.PREFERS];

const ConstraintTab: React.FC = observer(() => {
    const onDragStart = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            konanId: authStore.username,
            constraintType: type,
            fromShift: fromShift || null
        }));
    };

    const handleShiftTableDrop = (e: React.DragEvent, shift: Shift) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {konanId, constraintType, fromShift}: {
                konanId: string,
                constraintType: ConstraintType,
                fromShift: Shift
            } = JSON.parse(data);
            if (konanId && !sameShift(fromShift, shift)) {
                constraintStore.addConstraint({
                    konanId: konanId,
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
                konanId: string,
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
            konanId: authStore.username!
        });
    }

    const retreiveConstraintFromShift = (shift: Shift): ConstraintType | undefined => {
        return constraintStore.constraints.find(c => c.konanId === authStore.username && sameShift({
            date: c.shift.date,
            type: c.shift.type
        }, shift))?.constraintType;
    };

    return (
        <Container maxWidth="lg" dir="rtl">
            <CalendarNavigation/>
            <ShiftTable itemList={constraintTypes}
                        retrieveItemFromShift={retreiveConstraintFromShift}
                        assignHandler={assignConstraint}
                        getItemName={(item: ConstraintType) => item.toString()}
                        onDragStartHandler={onDragStart}
                        onDropHandler={handleShiftTableDrop}/>
            <DraggableList
                items={constraintTypes}
                getKey={item => item}
                getLabel={item => item}
                onDragStart={onDragStart}
                onDrop={handleDeleteAreaOnDrop}/>
        </Container>
    );
});

export default ConstraintTab;
