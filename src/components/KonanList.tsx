import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import konanimStore from '../stores/KonanimStore';
import shiftStore, {Konan, Shift} from '../stores/ShiftStore';
import AddKonanDialog from './AddKonanDialog';
import DeleteKonan from "./dialogs/DeleteKonan";
import EditKonan from "./dialogs/EditKonan";
import KonanInfoDialog from "./KonanInfoDialog";
import DraggableList from './DraggableList';
import {Button} from "@mui/material";

const KonanList: React.FC = observer(() => {
    const {konanim} = konanimStore;
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedKonan, setSelectedKonan] = useState<Konan | undefined>(undefined);
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);

    const deleteAreaOnDropHandler = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {fromShift}: { konan: Konan, fromShift: Shift } = JSON.parse(data);
            if (fromShift) {
                shiftStore.unassignKonan(fromShift);
            }
        } catch (e) {
            console.error("Error: " + e);
        }
    };
    const onDragStart = (e: React.DragEvent, konan: Konan, fromShift?: Shift) => {
        e.dataTransfer.setData('application/json', JSON.stringify({konan: konan, fromShift: fromShift || null}));
    };
    const handleEditDialogOpen = (konan: Konan) => {
        setSelectedKonan(konan);
        setEditDialogOpen(true);
    };

    const handleInfoDialogOpen = (konan: Konan) => {
        setSelectedKonan(konan);
        setInfoDialogOpen(true);
    };

    const handleDeleteDialogOpen = (konan: Konan) => {
        setSelectedKonan(konan);
        setDeleteDialogOpen(true);
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
    };

    const handleConfirmDelete = () => {
        // Implement delete logic here
        handleDeleteDialogClose();
    };

    const handleConfirmEdit = () => {
        // Implement edit logic here
        handleEditDialogClose();
    };

    return (
        <>
            <DraggableList
                items={konanim}
                getKey={k => k.id}
                getLabel={k => k.name}
                onDragStart={onDragStart}
                // onDrop={onDrop}
                onDrop={e => {
                    deleteAreaOnDropHandler(e)
                }}
                contextMenuItems={(konan) => [
                    {label: 'פרטי כונן', onClick: () => handleInfoDialogOpen(konan)},
                    {label: 'ערוך', onClick: () => handleEditDialogOpen(konan)},
                    {label: 'מחק', onClick: () => handleDeleteDialogOpen(konan)},
                ]}
                renderAddButton={() => (
                    <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)}>
                        הוסף כונן
                    </Button>
                )}
            />
            <EditKonan open={editDialogOpen}
                       handleDialogClose={handleEditDialogClose}
                       handleConfirm={handleConfirmEdit}
                       konan={selectedKonan}/>
            <DeleteKonan
                open={deleteDialogOpen}
                handleDialogClose={handleDeleteDialogClose}
                handleConfirm={handleConfirmDelete}
                selectedKonan={selectedKonan}/>
            <AddKonanDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}/>
            <KonanInfoDialog open={infoDialogOpen} konan={selectedKonan} onClose={() => setInfoDialogOpen(false)}/>
        </>
    );
});

export default KonanList;
