import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography } from '@mui/material';
import store from '../stores/ShiftStore';
import AssignEmployeeDialog from './AssignEmployeeDialog';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shiftTypes = ['Day', 'Night'] as const;

const ShiftTable: React.FC = observer(() => {
  const { weekDates, shifts, employees, assignEmployee } = store;
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Drag and drop handlers
  const onDrop = (e: React.DragEvent, shiftId: string) => {
    e.preventDefault(); // Fix: ensure drop event is handled
    const employeeId = e.dataTransfer.getData('employeeId');
    if (employeeId) {
      assignEmployee(shiftId, employeeId);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Fix: allow drop
  };

  const handleCellClick = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setAssignDialogOpen(true);
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ mb: 4, borderRadius: 3, background: 'rgba(34,34,34,0.95)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: '#23272f', color: '#61dafb', fontWeight: 700 }}>Shift</TableCell>
              {weekDates.map((date, idx) => (
                <TableCell key={days[idx]} align="center" sx={{ background: '#23272f', color: '#61dafb', fontWeight: 700 }}>
                  <Box>
                    <Typography variant="body2">{days[idx]}</Typography>
                    <Typography variant="caption" sx={{ background: '#23272f', borderRadius: 1, px: 1, color: '#fff' }}>{date.getDate()}</Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shiftTypes.map(shiftType => (
              <TableRow key={shiftType}>
                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{shiftType}</TableCell>
                {weekDates.map((date, idx) => {
                  const shift = shifts.find(s => s.date === date.toISOString() && s.type === shiftType);
                  const employee = employees.find(e => e.id === shift?.employeeId);
                  return (
                    <TableCell
                      key={date.toISOString() + shiftType}
                      onDrop={e => onDrop(e, shift?.id || '')}
                      onDragOver={onDragOver}
                      onClick={() => shift && handleCellClick(shift.id)}
                      sx={{ minHeight: 48, borderRadius: 2, background: '#282c34', color: '#fff', cursor: 'pointer' }}
                    >
                      {employee ? (
                        <Box sx={{ background: 'linear-gradient(135deg, #61dafb 60%, #21a1f3 100%)', color: '#23272f', borderRadius: 1, px: 1, py: 0.5, fontWeight: 700 }}>{employee.name}</Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#61dafb99' }}>Drop here</Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AssignEmployeeDialog open={assignDialogOpen} shiftId={selectedShiftId} onClose={() => setAssignDialogOpen(false)} />
    </>
  );
});

export default ShiftTable;
