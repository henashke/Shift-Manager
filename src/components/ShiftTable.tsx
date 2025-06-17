import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import store from '../stores/ShiftStore';
import AssignEmployeeDialog from './AssignEmployeeDialog';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shiftTypes = ['Day', 'Night'] as const;

const ShiftTable: React.FC = observer(() => {
  const { weekDates, shifts, employees, assignEmployee } = store;
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; shiftId: string | null } | null>(null);

  // Drag and drop handlers
  const onDrop = (e: React.DragEvent, shiftId: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    try {
      const { employeeId, fromShiftId } = JSON.parse(data);
      if (employeeId && shiftId && shiftId !== fromShiftId) {
        assignEmployee(shiftId, employeeId);
        // Optionally, unassign from previous shift if needed (handled by assignEmployee)
      }
    } catch {
      // fallback for old format
      const employeeId = e.dataTransfer.getData('employeeId');
      if (employeeId) assignEmployee(shiftId, employeeId);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCellClick = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setAssignDialogOpen(true);
  };

  const onDragStart = (e: React.DragEvent, employeeId: string, fromShiftId?: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ employeeId, fromShiftId: fromShiftId || null }));
  };

  const handleContextMenu = (event: React.MouseEvent, shiftId: string) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            shiftId,
          }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleAssignEmployee = () => {
    if (contextMenu?.shiftId) {
      setSelectedShiftId(contextMenu.shiftId);
      setAssignDialogOpen(true);
    }
    handleCloseContextMenu();
  };

  const handleRemoveEmployee = () => {
    if (contextMenu?.shiftId) {
      store.unassignEmployee(contextMenu.shiftId);
    }
    handleCloseContextMenu();
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
                      onContextMenu={e => shift && handleContextMenu(e, shift.id)}
                      sx={{ minHeight: 48, borderRadius: 2, background: '#282c34', color: '#fff', cursor: 'pointer' }}
                    >
                      {employee ? (
                        <Box
                          sx={{ background: 'linear-gradient(135deg, #61dafb 60%, #21a1f3 100%)', color: '#23272f', borderRadius: 1, px: 1, py: 0.5, fontWeight: 700 }}
                          draggable
                          onDragStart={e => onDragStart(e, employee.id, shift?.id)}
                        >
                          {employee.name}
                        </Box>
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
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleAssignEmployee}>
          <ListItemIcon>
            <PersonAddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Assign Employee</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRemoveEmployee} disabled={!contextMenu?.shiftId || !shifts.find(s => s.id === contextMenu.shiftId)?.employeeId}>
          <ListItemIcon>
            <PersonRemoveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove Employee</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
});

export default ShiftTable;
