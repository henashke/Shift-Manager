import React from 'react';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from './CalendarNavigation';
import DraggableList from './DraggableList';
import {ConstraintType} from './ConstraintTypeList';
import ShiftTable from './ShiftTable';
import {Container} from "@mui/material";
import {Shift, ShiftType} from '../stores/ShiftStore';
import authStore from "../stores/AuthStore";
import {Constraint, constraintStore} from "../stores/ConstraintStore";

const constraintTypes = [ConstraintType.CANT, ConstraintType.PREFERS_NOT, ConstraintType.PREFERS];

const ConstraintTab: React.FC = observer(() => {
    // Drag and drop handlers for constraint types
    const onDragStart = (e: React.DragEvent, type: ConstraintType) => {
        e.dataTransfer.setData('application/json', JSON.stringify({konanId: authStore.username, constraintType: type}));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {konanId, constraintType, shift} = JSON.parse(data);
            if (konanId && shift) {
                constraintStore.addConstraint({
                    konanId: konanId,
                    date: shift.shiftDate,
                    shiftType: shift.shiftType,
                    constraintType: constraintType
                });
            }
        } catch {
            // fallback: do nothing
        }
    };
    // No-op for onDrop/onDragOver for now, can be extended for unassigning constraints

    const assignConstraint = (shift: Shift, constraintType: ConstraintType) => {
        constraintStore.addConstraint({
            constraintType: constraintType,
            date: shift.date,
            shiftType: shift.type,
            konanId: authStore.username!
        });
    }

    const retreiveConstraintFromShift = (shift: Shift): ConstraintType | undefined => {
        return constraintStore.constraints.find(c => c.konanId === authStore.username && c.date === shift.date && c.shiftType === shift.type)?.constraintType;
    };

    return (
        <Container maxWidth="lg" dir="rtl">
            <CalendarNavigation/>
            <ShiftTable itemList={constraintTypes}
                        onDropHandler={handleDrop}
                        retreiveItemFromShift={retreiveConstraintFromShift}
                        assignHandler={assignConstraint}
                        getItemName={(item: ConstraintType) => item.toString()}
                        onDragStartHandler={onDragStart}/>
            <DraggableList
                items={constraintTypes}
                getKey={item => item}
                getLabel={item => item}
                onDragStart={onDragStart}
                onDrop={handleDrop}/>
        </Container>
    );
});

export default ConstraintTab;
