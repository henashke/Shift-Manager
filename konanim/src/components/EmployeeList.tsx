import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, Paper } from '@mui/material';
import store from '../stores/ShiftStore';

const EmployeeList: React.FC = observer(() => {
  const { employees } = store;

  const onDragStart = (e: React.DragEvent, employeeId: string) => {
    e.dataTransfer.setData('employeeId', employeeId);
  };

  return (
    <Paper sx={{ mt: 4, p: 2, borderRadius: 2, background: 'rgba(34,34,34,0.85)' }}>
      <Typography variant="h6" sx={{ color: '#61dafb', mb: 2, fontWeight: 700 }}>Employees</Typography>
      <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
        {employees.map(emp => (
          <Box
            key={emp.id}
            draggable
            onDragStart={e => onDragStart(e, emp.id)}
            sx={{
              background: 'linear-gradient(135deg, #61dafb 60%, #21a1f3 100%)',
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
                background: 'linear-gradient(135deg, #21a1f3 60%, #61dafb 100%)',
                color: '#fff',
                boxShadow: 4,
                transform: 'scale(0.97)',
              },
            }}
          >
            {emp.name}
          </Box>
        ))}
      </Box>
    </Paper>
  );
});

export default EmployeeList;

