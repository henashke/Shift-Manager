import React from 'react';
import CalendarNavigation from './CalendarNavigation';
import ShiftTable from './ShiftTable';
import KonanList from './KonanList';
import {Container} from "@mui/material";
import store from "../stores/ShiftStore";
import shiftStore, {Konan, sameShift, Shift} from "../stores/ShiftStore";
import konanimStore from "../stores/KonanimStore";

const AssignmentTab: React.FC = () => {
    const {assignKonan} = store;
    const {konanim} = konanimStore;


    const onDragStart = (e: React.DragEvent, konan: Konan, fromShift?: Shift) => {
        e.dataTransfer.setData('application/json', JSON.stringify({konanId: konan.id, fromShift: fromShift || null}));
    };

    const handleDrop = (e: React.DragEvent, shift: Shift) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        console.log('Dropping data:', data);
        try {
            const {konanId, fromShift} = JSON.parse(data);
            console.log('Parsed drop data:', {konanId, fromShift});
            if (konanId && !sameShift(fromShift, shift)) {
                console.log('Assigning konan:', konanId, 'from shift:', fromShift, 'to shift:', shift);
                assignKonan(shift, konanId);
            }
        } catch {
            // fallback: do nothing
        }
    };

    const getKonanFromShift = (shift: Shift): Konan | undefined => {
        return konanim.find(k => k.id === shiftStore.getAssignedShift(shift)?.konanId);
    }

    return (
        <Container maxWidth={"lg"} dir={"rtl"}>
            <CalendarNavigation/>
            <ShiftTable onDropHandler={handleDrop}
                        onDragStartHandler={onDragStart}
                        assignHandler={(shift, konan) => assignKonan(shift, konan.id)}
                        retreiveItemFromShift={getKonanFromShift}
                        getItemName={(konan: Konan) => (konan.name)}
                        itemList={konanim}/>
            <KonanList/>
        </Container>
    );
};

export default AssignmentTab;
