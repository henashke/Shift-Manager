import React from 'react';
import {observer} from 'mobx-react-lite';
import {Box, Fab, Tooltip, Typography} from '@mui/material';
import store from '../../stores/ShiftStore';
import {ChevronLeft, ChevronRight, Today} from '@mui/icons-material';

const CalendarNavigation: React.FC = observer(() => {
    const weekDates = store.weekDates;
    const handlePrevWeekClick = () => store.setWeekOffset(store.weekOffset - 1);
    const handleNextWeekClick = () => store.setWeekOffset(store.weekOffset + 1);
    const handleTodayClick = () => store.setWeekOffset(0);

    const formatDate = (date: Date) =>
        date.toLocaleDateString('he-IL', {month: 'short', day: 'numeric', year: 'numeric'});

    return (
        <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={3}>
            <Fab variant={"extended"} color={"primary"} sx={{flexShrink: 0}}
                 onClick={handlePrevWeekClick}><ChevronRight/></Fab>
            <Typography variant="h6" sx={{px: 2, borderRadius: 2}}>
                {formatDate(weekDates[0])}
                {' - '}
                {formatDate(weekDates[6])}
            </Typography>
            <Fab variant={"extended"} color={"primary"} sx={{flexShrink: 0}}
                 onClick={handleNextWeekClick}><ChevronLeft/></Fab>
            <Tooltip title={"חזרה להיום"} placement="bottom" arrow>
                <Fab disabled={store.weekOffset === 0} color={"secondary"} variant={"extended"} sx={{flexShrink: 0}}
                     onClick={handleTodayClick}><Today/></Fab>
            </Tooltip>
        </Box>
    );
});

export default CalendarNavigation;
