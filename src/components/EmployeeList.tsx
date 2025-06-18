import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {Box, Button, Menu, MenuItem, Paper, Typography} from '@mui/material';
import store, {Employee} from '../stores/ShiftStore';
import AddEmployeeDialog from './AddEmployeeDialog';
import DeleteKonan from "./dialogs/DeleteKonan";
import EditKonan from "./dialogs/EditKonan";

const EmployeeList: React.FC = observer(() => {
    const {konanim} = store;
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {fromShiftId} = JSON.parse(data);
            if (fromShiftId) {
                store.unassignEmployee(fromShiftId);
            }
        } catch {
            // fallback: do nothing
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDragStart = (e: React.DragEvent, employeeId: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({employeeId, fromShiftId: null}));
    };

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, employee: any) => {
        event.preventDefault();
        setSelectedEmployee(employee);
        setMenuAnchor(event.currentTarget);
    };

    const handleEditDialogOpen = () => {
        setEditDialogOpen(true);
    };

    const handleDeleteDialogOpen = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
        setSelectedEmployee(undefined);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setSelectedEmployee(undefined);
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
        <Paper sx={{mt: 4, p: 2, borderRadius: 2, background: '#2c2c30'}}
               onDrop={onDrop}
               onDragOver={onDragOver}
        >
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography variant="h6" sx={{color: '#61dafb', mb: 2, fontWeight: 700}}>כוננים</Typography>
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
                            background: '#61dafb',
                            color: '#23272f',
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1.08em',
                            cursor: 'grab',
                            boxShadow: 2,
                            border: '2px solid #61dafb44',
                            userSelect: 'none',
                            '&:active': {
                                background: '#21a1f3',
                                color: '#fff',
                                boxShadow: 4,
                                transform: 'scale(0.97)',
                            },
                        }}
                    >
                        {konan.name}
                    </Box>
                ))}
            </Box>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={handleEditDialogOpen}>ערוך</MenuItem>
                <MenuItem onClick={handleDeleteDialogOpen}>מחק</MenuItem>
            </Menu>
            <EditKonan open={editDialogOpen}
                       handleDialogClose={handleEditDialogClose}
                       handleConfirm={handleConfirmEdit}
                       employee={selectedEmployee} />
            <DeleteKonan
                open={deleteDialogOpen}
                handleDialogClose={handleDeleteDialogClose}
                handleConfirm={handleConfirmDelete}
                selectedEmployee={selectedEmployee} />
            <AddEmployeeDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
        </Paper>
    );
});

export default EmployeeList;
