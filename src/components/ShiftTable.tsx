import React, {useEffect, useState} from 'react';
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
import shiftStore, {sameShift, Shift} from '../stores/ShiftStore';
import konanimStore from '../stores/KonanimStore';
import AssignToShiftDialog from './AssignToShiftDialog';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import {constraintStore} from "../stores/ConstraintStore";

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const shiftTypes = ['יום', 'לילה'] as const;

interface ShiftTableProps<T> {
    retrieveItemFromShift: (shift: Shift) => T | undefined;
    getItemName: (item: T) => string;
    assignHandler: (shift: Shift, item: T) => void;
    itemList: T[];
    onDropHandler?: (e: React.DragEvent, shift: Shift) => void;
    onDragEndHandler?: () => void;
    onDragStartHandler?: (e: React.DragEvent, draggedElement: T, fromShift?: Shift) => void;
}

function ShiftTable<T>({ retrieveItemFromShift, getItemName, assignHandler, itemList, onDropHandler, onDragStartHandler, onDragEndHandler }: ShiftTableProps<T>) {
    const {weekDates, assignedShifts} = store;
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        shift: Shift | null
    } | null>(null);

    useEffect(() => {
        konanimStore.fetchKonanim();
        shiftStore.fetchShifts();
        constraintStore.fetchConstraint();
    }, []);

    const onDrop = (e: React.DragEvent, shift: Shift) => {
        onDropHandler?.(e, shift);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleCellClick = (shift: Shift) => {
        setSelectedShift(shift);
        setAssignDialogOpen(true);
    };

    const onDragStart = (e: React.DragEvent, draggedItem: T, fromShift?: Shift) => {
        onDragStartHandler?.(e, draggedItem, fromShift);
    };

    const handleContextMenu = (event: React.MouseEvent, shift: Shift) => {
        event.preventDefault();
        setContextMenu(
            contextMenu === null
                ? {
                    mouseX: event.clientX - 2,
                    mouseY: event.clientY - 4,
                    shift,
                }
                : null,
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleAssignKonan = () => {
        if (contextMenu?.shift) {
            setSelectedShift(contextMenu.shift);
            setAssignDialogOpen(true);
        }
        handleCloseContextMenu();
    };

    const handleRemoveKonan = () => {
        if (contextMenu?.shift) {
            store.unassignKonan(contextMenu.shift);
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
                                const shift = {date: date, type: shiftType};
                                const item = retrieveItemFromShift(shift);
                                return (
                                    <TableCell
                                        key={date.toISOString() + shiftType}
                                        align="center"
                                        onDrop={e => onDrop(e, shift)}
                                        onDragOver={onDragOver}
                                        onClick={() => shift && handleCellClick(shift)}
                                        onContextMenu={e => shift && handleContextMenu(e, shift)}
                                        sx={{minHeight: 48, borderRadius: 2, color: 'common.white', cursor: 'pointer'}}
                                    >
                                        {item ? (
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
                                                onDragStart={e => onDragStart(e, item, shift)}
                                                onDragEnd={onDragEndHandler}
                                            >
                                                {getItemName(item)}
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
            <AssignToShiftDialog
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                shift={selectedShift}
                itemList={itemList}
                getItemName={getItemName}
                assignFunction={assignHandler}
            />

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
                          disabled={!contextMenu?.shift || !assignedShifts.find(s => sameShift(s, contextMenu.shift!))?.konanId}>
                    <ListItemIcon>
                        <PersonRemoveIcon fontSize="small"/>
                    </ListItemIcon>
                    <ListItemText>הסר כונן משובץ</ListItemText>
                </MenuItem>
            </Menu>
        </TableContainer>
    );
}

const ObserverShiftTable = observer(ShiftTable) as typeof ShiftTable;
export default ObserverShiftTable;
