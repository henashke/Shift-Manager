import React, {useState} from 'react';
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
import store, {sameShift, Shift} from '../stores/ShiftStore';
import AssignToShiftDialog from './AssignToShiftDialog';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ShiftTableActions from './ShiftTableActions';

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const shiftTypes = ['יום', 'לילה'] as const;

interface ShiftTableProps<T> {
    retrieveItemFromShift: (shift: Shift) => T | undefined;
    getItemName: (item: T) => string;
    assignHandler: (shift: Shift, item: T) => void;
    unassignHandler: (shift: Shift) => void;
    itemList: T[];
    assignedShifts: Shift[];
    isPendingItems?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    pendingItem?: (shift: Shift) => T | undefined;
    onDropHandler?: (e: React.DragEvent, shift: Shift) => void;
    onDragEndHandler?: () => void;
    onDragStartHandler?: (e: React.DragEvent, draggedElement: T, fromShift?: Shift) => void;
}

function ShiftTable<T>({
                           retrieveItemFromShift,
                           getItemName,
                           assignHandler,
                           unassignHandler,
                           itemList,
                           assignedShifts,
                           isPendingItems,
                           onSave,
                           onCancel,
                           pendingItem,
                           onDropHandler,
                           onDragStartHandler,
                           onDragEndHandler
                       }: ShiftTableProps<T>) {
    const {weekDates} = store;
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        shift: Shift | null
    } | null>(null);

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

    const handleAssignUser = () => {
        if (contextMenu?.shift) {
            setSelectedShift(contextMenu.shift);
            setAssignDialogOpen(true);
        }
        handleCloseContextMenu();
    };

    const handleRemoveItem = () => {
        if (contextMenu?.shift) {
            unassignHandler?.(contextMenu.shift);
        }
        handleCloseContextMenu();
    };

    // Helper to get the assigned item, prioritizing pendingItem prop if provided
    const getPendingOrAssignedItem = (shift: Shift) => {
        if (pendingItem) {
            const pending = pendingItem(shift);
            if (pending) return pending;
        }
        return retrieveItemFromShift(shift);
    };

    return (
        <Box sx={{display: 'flex', gap: 2, height: '100%'}}>
            {
                isPendingItems && onSave && onCancel &&
                <ShiftTableActions
                    onSave={onSave}
                    onCancel={onCancel}
                />
            }
            <TableContainer component={Paper} sx={{borderRadius: 3, boxShadow: 3, direction: 'rtl', height: '100%'}}
                            dir="rtl">
                <Table className="shift-table">
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            {weekDates.map((date, i) => (
                                <TableCell key={i} align="center">
                                    <Typography variant={"h6"}>{days[date.getDay()]}</Typography>
                                    <Typography>{date.toLocaleDateString('he-IL', {
                                        day: '2-digit',
                                        month: '2-digit'
                                    })}</Typography>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shiftTypes.map(shiftType => (
                            <TableRow key={shiftType}>
                                <TableCell>
                                    <Typography variant={"body1"}>
                                        {shiftType}
                                    </Typography>
                                </TableCell>
                                {weekDates.map((date) => {
                                    const shift = {date: date, type: shiftType};
                                    const item = getPendingOrAssignedItem(shift);
                                    const isPending = pendingItem?.(shift) !== undefined;
                                    return (
                                        <TableCell
                                            key={date.toISOString() + shiftType}
                                            align="center"
                                            onDrop={e => onDrop(e, shift)}
                                            onDragOver={onDragOver}
                                            onClick={() => shift && handleCellClick(shift)}
                                            onContextMenu={e => shift && handleContextMenu(e, shift)}
                                            sx={{
                                                minHeight: 48,
                                                borderRadius: 2,
                                                color: 'common.white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {item ? (
                                                <Box
                                                    sx={{
                                                        background: theme => isPending ? theme.palette.secondary.main : theme.palette.primary.main,
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
                                                <Typography variant="body1" sx={{color: '#7d7bf2'}}>כונן
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
                    <MenuItem onClick={handleAssignUser}>
                        <ListItemIcon>
                            <PersonAddIcon fontSize="small"/>
                        </ListItemIcon>
                        <ListItemText>שבץ כונן</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleRemoveItem}
                              disabled={!contextMenu?.shift || !assignedShifts.find(s => sameShift(s, contextMenu.shift!))}>
                        <ListItemIcon>
                            <PersonRemoveIcon fontSize="small"/>
                        </ListItemIcon>
                        <ListItemText>הסר כונן משובץ</ListItemText>
                    </MenuItem>
                </Menu>
            </TableContainer>
        </Box>
    );
}

const ObserverShiftTable = observer(ShiftTable) as typeof ShiftTable;
export default ObserverShiftTable;
