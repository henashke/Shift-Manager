import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {Box, Button, Paper, Typography} from '@mui/material';
import store from '../stores/ShiftStore';
import AddEmployeeDialog from "./AddEmployeeDialog";

const EmployeeList: React.FC = observer(() => {
    const {konanim} = store;
    const [addDialogOpen, setAddDialogOpen] = useState(false);

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
            <AddEmployeeDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}/>
        </Paper>
    );
});

export default EmployeeList;
