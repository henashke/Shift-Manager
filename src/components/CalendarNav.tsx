import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Button, Typography } from '@mui/material';
import store from '../stores/ShiftStore';

const CalendarNav: React.FC = observer(() => {
  const weekDates = store.weekDates;
  const handlePrev = () => store.setWeekOffset(store.weekOffset - 1);
  const handleNext = () => store.setWeekOffset(store.weekOffset + 1);

  return (
    <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={3}>
      <Button variant="outlined" onClick={handlePrev}>&lt;</Button>
      <Typography variant="h6" sx={{ px: 2, background: '#23272f', borderRadius: 2, color: '#fff' }}>
        {weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        {' - '}
        {weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </Typography>
      <Button variant="outlined" onClick={handleNext}>&gt;</Button>
    </Box>
  );
});

export default CalendarNav;

