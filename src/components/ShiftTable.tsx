import React, {useState, useEffect} from 'react';
import {observer} from 'mobx-react-lite';
import {
    Box,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import store from '../stores/ShiftStore';
import konanimStore from '../stores/KonanimStore';
import AssignKonanDialog from './AssignKonanDialog';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

// Hebrew day and shift names
const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const shiftTypes = ['יום', 'לילה'] as const;

const ShiftTable: React.FC = observer(() => {
    const {weekDates, shifts, assignKonan} = store;
    const {konanim} = konanimStore;
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        shiftId: string | null
    } | null>(null);

    useEffect(() => {
        konanimStore.fetchKonanim();
    }, []);

    // Drag and drop handlers
    const onDrop = (e: React.DragEvent, shiftId: string) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {konanId, fromShiftId} = JSON.parse(data);
            if (konanId && shiftId && shiftId !== fromShiftId) {
                assignKonan(shiftId, konanId);
            }
        } catch {
            // fallback: do nothing
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleCellClick = (shiftId: string) => {
        setSelectedShiftId(shiftId);
        setAssignDialogOpen(true);
    };

    const onDragStart = (e: React.DragEvent, konanId: string, fromShiftId?: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({konanId, fromShiftId: fromShiftId || null}));
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

    const handleAssignKonan = () => {
        if (contextMenu?.shiftId) {
            setSelectedShiftId(contextMenu.shiftId);
            setAssignDialogOpen(true);
        }
        handleCloseContextMenu();
    };

    const handleRemoveKonan = () => {
        if (contextMenu?.shiftId) {
            store.unassignKonan(contextMenu.shiftId);
        }
        handleCloseContextMenu();
    };

    return (
        <TableContainer component={Paper} sx={{mt: 3, mb: 4, borderRadius: 3, boxShadow: 3, direction: 'rtl'}}
                        dir="rtl">
            <Table className="shift-table">
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        {weekDates.map((date, i) => (
                            <TableCell key={i} align="center">
                                <div className="calendar-day">{days[date.getDay()]}</div>
                                <div className="calendar-date">{date.toLocaleDateString('he-IL', {
                                    day: '2-digit',
                                    month: '2-digit'
                                })}</div>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {shiftTypes.map(shiftType => (
                        <TableRow key={shiftType}>
                            <TableCell sx={{fontWeight: 600}}>{shiftType}</TableCell>
                            {weekDates.map((date) => {
                                const shift = shifts.find(s => s.date === date.toISOString() && s.type === shiftType);
                                const konan = konanim.find(e => e.id === shift?.konanId);
                                return (
                                    <TableCell
                                        key={date.toISOString() + shiftType}
                                        align="center"
                                        onDrop={e => onDrop(e, shift?.id || '')}
                                        onDragOver={onDragOver}
                                        onClick={() => shift && handleCellClick(shift.id)}
                                        onContextMenu={e => shift && handleContextMenu(e, shift.id)}
                                        sx={{minHeight: 48, borderRadius: 2, color: 'common.white', cursor: 'pointer'}}
                                    >
                                        {konan ? (
                                            <Box
                                                sx={{
                                                    background: theme => theme.palette.primary.main,
                                                    color: 'common.white',
                                                    borderRadius: 1,
                                                    px: 1,
                                                    py: 0.5,
                                                    fontWeight: 700
                                                }}
                                                draggable
                                                onDragStart={e => onDragStart(e, konan.id, shift?.id)}
                                            >
                                                {konan.name}
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" sx={{color: '#7d7bf2'}}>כונן
                                                משובץ</Typography>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <AssignKonanDialog open={assignDialogOpen} shiftId={selectedShiftId}
                                  onClose={() => setAssignDialogOpen(false)}/>
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? {top: contextMenu.mouseY, left: contextMenu.mouseX}
                        : undefined
                }
            >
                <MenuItem onClick={handleAssignKonan}>
                    <ListItemIcon>
                        <PersonAddIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText>שבץ כונן</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleRemoveKonan}
                          disabled={!contextMenu?.shiftId || !shifts.find(s => s.id === contextMenu.shiftId)?.konanId}>
                    <ListItemIcon>
                        <PersonRemoveIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText>הסר כונן משובץ</ListItemText>
                </MenuItem>
            </Menu>
        </TableContainer>
    );
});

export default ShiftTable;
