import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Button, Typography } from '@mui/material';
import store from '../stores/ShiftStore';

const CalendarNavigation: React.FC = observer(() => {
  const weekDates = store.weekDates;
  const handlePrevWeekClick = () => store.setWeekOffset(store.weekOffset - 1);
  const handleNextWeekClick = () => store.setWeekOffset(store.weekOffset + 1);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={3}>
      <Button variant="outlined" onClick={handlePrevWeekClick}>{'<'}</Button>
      <Typography variant="h6" sx={{ px: 2, background: '#23272f', borderRadius: 2, color: '#fff' }}>
        {formatDate(weekDates[0])}
        {' - '}
        {formatDate(weekDates[6])}
      </Typography>
      <Button variant="outlined" onClick={handleNextWeekClick}>{'>'}</Button>
    </Box>
  );
});

export default CalendarNavigation;
