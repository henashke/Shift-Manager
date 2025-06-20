import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {Box, Button, Menu, MenuItem, Paper} from '@mui/material';
import konanimStore from '../stores/KonanimStore';
import shiftStore, { Konan } from '../stores/ShiftStore';
import AddKonanDialog from './AddKonanDialog';
import DeleteKonan from "./dialogs/DeleteKonan";
import EditKonan from "./dialogs/EditKonan";
import KonanInfoDialog from "./KonanInfoDialog";

const KonanList: React.FC = observer(() => {
    const {konanim} = konanimStore;
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedKonan, setSelectedKonan] = useState<Konan | undefined>(undefined);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {fromShiftId} = JSON.parse(data);
            if (fromShiftId) {
                shiftStore.unassignKonan(fromShiftId);
            }
        } catch {
            // fallback: do nothing
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDragStart = (e: React.DragEvent, konanId: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({konanId, fromShiftId: null}));
    };

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, konan: any) => {
        event.preventDefault();
        setSelectedKonan(konan);
        setMenuAnchor(event.currentTarget);
    };

    const handleEditDialogOpen = () => {
        setEditDialogOpen(true);
    };

    const handleInfoDialogOpen = () => {
        setInfoDialogOpen(true);
    };

    const handleDeleteDialogOpen = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
        setSelectedKonan(undefined);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setSelectedKonan(undefined);
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
        <Paper sx={{mt: 4, p: 2, borderRadius: 2}}
               onDrop={onDrop}
               onDragOver={onDragOver}
        >
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                {/*<Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 700}}>כוננים</Typography>*/}
                <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)}>
                    הוסף כונן
                </Button>
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                {konanim.map(konan => (
                    <Box
                        key={konan.id}
                        draggable
                        onDragStart={e => onDragStart(e, konan.id)}
                        onContextMenu={e => handleContextMenu(e, konan)}
                        sx={{
                            background: theme => theme.palette.primary.main,
                            color: 'common.white',
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1.08em',
                            cursor: 'grab',
                            boxShadow: 2,
                            userSelect: 'none',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            '&:active': {
                                background: theme => theme.palette.primary.dark,
                                color: 'common.white',
                                boxShadow: 4,
                                transform: 'scale(0.97)',
                            },
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'scale(1.04)',
                                cursor: 'pointer',
                            },
                        }}
                    >
                        {konan.name}
                    </Box>
                ))}
            </Box>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={handleInfoDialogOpen}>פרטי כונן</MenuItem>
                <MenuItem onClick={handleEditDialogOpen}>ערוך</MenuItem>
                <MenuItem onClick={handleDeleteDialogOpen}>מחק</MenuItem>
            </Menu>
            <EditKonan open={editDialogOpen}
                       handleDialogClose={handleEditDialogClose}
                       handleConfirm={handleConfirmEdit}
                       konan={selectedKonan} />
            <DeleteKonan
                open={deleteDialogOpen}
                handleDialogClose={handleDeleteDialogClose}
                handleConfirm={handleConfirmDelete}
                selectedKonan={selectedKonan} />
            <AddKonanDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
            <KonanInfoDialog open={infoDialogOpen} konan={selectedKonan} onClose={() => setInfoDialogOpen(false)} />
        </Paper>
    );
});

export default KonanList;
