import React, { useState } from 'react';
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
    const [isDragged, setIsDragged] = useState(false);


    const onDragStart = (e: React.DragEvent, konan: Konan, fromShift?: Shift) => {
        setIsDragged(true);
        e.dataTransfer.setData('application/json', JSON.stringify({konan: konan, fromShift: fromShift || null}));
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
            const {konan, fromShift}: { konan: Konan, fromShift: Shift } = JSON.parse(data);
            if (konan && !sameShift(fromShift, shift)) {
                assignKonan(shift, konan.id);
            }
        } catch(e) {
            console.error("Failed to parse data from drag event:", data, e);
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
                        onDragEndHandler={onDragEnd}
                        assignHandler={(shift, konan) => assignKonan(shift, konan.id)}
                        retrieveItemFromShift={getKonanFromShift}
                        getItemName={(konan: Konan) => (konan.name)}
                        itemList={konanim}/>
            <KonanList isDragged={isDragged}/>
        </Container>
    );
};

export default AssignmentTab;
