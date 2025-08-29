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
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import store, {sameShift, Shift, ShiftType} from '../stores/ShiftStore';
import AssignToShiftDialog from './AssignToShiftDialog';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShiftTableActions from './ShiftTableActions';
import authStore from '../stores/AuthStore';
import notificationStore from '../stores/NotificationStore';

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const shiftTypes = ['יום', 'לילה'] as const;

interface ShiftTableProps<T> {
    retrieveItemFromShift: (shift: Shift) => T | undefined;
    getItemName: (item: T, shift?: Shift) => string;
    assignHandler: (shift: Shift, item: T) => void;
    unassignHandler: (shift: Shift) => void;
    itemList: T[];
    assignedShifts: Shift[];
    isPendingItems?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    retrievePendingItem?: (shift: Shift) => T | undefined;
    onDropHandler?: (e: React.DragEvent, shift: Shift) => void;
    onDragEndHandler?: () => void;
    onDragStartHandler?: (e: React.DragEvent, draggedElement: T, fromShift?: Shift) => void;
    itemName?: string;
    requireAdmin?: boolean;
    additionalContextMenuItems?: {
        label: string;
        icon: React.ReactNode;
        action: (shift: Shift) => void;
        disabled?: (shift: Shift) => boolean;
    }[]
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
                           retrievePendingItem,
                           onDropHandler,
                           onDragStartHandler,
                           onDragEndHandler,
                           itemName,
                           requireAdmin = true,
                           additionalContextMenuItems,
                       }: ShiftTableProps<T>) {
    const theme = useTheme();
    const isNarrowScreen = useMediaQuery(theme.breakpoints.down('md')); // Switch to vertical on screens smaller than 'md' breakpoint
    const {weekDates} = store;
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        shift: Shift | null
    } | null>(null);

    const onDrop = (e: React.DragEvent, shift: Shift) => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        onDropHandler?.(e, shift);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleCellClick = (shift: Shift) => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
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
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        if (contextMenu?.shift) {
            setSelectedShift(contextMenu.shift);
            setAssignDialogOpen(true);
        }
        handleCloseContextMenu();
    };

    const handleRemoveItem = () => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        if (contextMenu?.shift) {
            unassignHandler?.(contextMenu.shift);
        }
        handleCloseContextMenu();
    };

    const getPendingOrAssignedItem = (shift: Shift) => {
        if (retrievePendingItem) {
            const pending = retrievePendingItem(shift);
            if (pending) return pending;
        }
        return retrieveItemFromShift(shift);
    };

    const WeekDayHeaderTableCell = ({date}: { date: Date }) => (
        <TableCell key={date.toISOString()} align="center">
            <Typography variant={"h6"}>{days[date.getDay()]}</Typography>
            <Typography>{date.toLocaleDateString('he-IL', {
                day: '2-digit',
                month: '2-digit'
            })}</Typography>
        </TableCell>
    );

    const ShiftTypeHeaderTableCell = ({shiftType}: { shiftType: ShiftType }) => (
        <TableCell key={shiftType.toString()} align="center">
            <Typography variant={"h6"}>{shiftType}</Typography>
        </TableCell>
    );

    const VerticalTableHeader = () => <TableHead>
        <TableRow>
            <TableCell></TableCell>
            {shiftTypes.map((shiftType, i) => (
                <ShiftTypeHeaderTableCell shiftType={shiftType}/>
            ))}
        </TableRow>
    </TableHead>

    const HorizontalTableHeader = () => <TableHead>
        <TableRow>
            <TableCell></TableCell>
            {weekDates.map((date, index: number) => (
                <WeekDayHeaderTableCell key={index} date={date}/>
            ))}
        </TableRow>
    </TableHead>

    const tableHeader = isNarrowScreen ? <VerticalTableHeader/> : <HorizontalTableHeader/>;

    const createTableCell = (date: Date, shiftType: ShiftType) => {
        const shift = {date: date, type: shiftType};
        const item = getPendingOrAssignedItem(shift);
        const isPending = retrievePendingItem?.(shift) !== undefined;
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
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                        }}>
                            {getItemName(item, shift)}
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="body1" sx={{color: '#7d7bf2'}}>כונן
                        משובץ</Typography>
                )}
            </TableCell>
        );
    }

    const VerticalTableBody = () => <TableBody>
        {weekDates.map((date) => (
            <TableRow key={date.toISOString()}>
                <WeekDayHeaderTableCell date={date}/>
                {shiftTypes.map(shiftType => createTableCell(date, shiftType))}
            </TableRow>
        ))}
    </TableBody>

    const HorizontalTableBody = () => <TableBody>
        {shiftTypes.map((shiftType, i) => (
            <TableRow key={shiftType}>
                <ShiftTypeHeaderTableCell shiftType={shiftType}/>
                {weekDates.map((date) => createTableCell(date, shiftType))}
            </TableRow>
        ))}
    </TableBody>

    const tableBody = isNarrowScreen ? <VerticalTableBody/> : <HorizontalTableBody/>


    return (

        <Box sx={{display: 'flex', gap: 2, height: '100%', mb: 4}}>
            {
                isPendingItems && onSave && onCancel &&
                <ShiftTableActions
                    onSave={onSave}
                    onCancel={onCancel}
                    requireAdmin={requireAdmin}
                />
            }
            <TableContainer component={Paper} sx={{borderRadius: 3, boxShadow: 3, direction: 'rtl', height: '100%'}}
                            dir="rtl">
                <Table className="shift-table">
                    {tableHeader}
                    {tableBody}
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
                            <AddIcon fontSize="small"/>
                        </ListItemIcon>
                        <ListItemText>הוסף {itemName}</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleRemoveItem}
                              disabled={!contextMenu?.shift || !assignedShifts.find(s => sameShift(s, contextMenu.shift!))}>
                        <ListItemIcon>
                            <RemoveIcon fontSize="small"/>
                        </ListItemIcon>
                        <ListItemText>הסר {itemName}</ListItemText>
                    </MenuItem>
                    {additionalContextMenuItems && contextMenu?.shift && additionalContextMenuItems.map((menuItem, index) => (
                        <MenuItem
                            key={index}
                            onClick={() => {
                                menuItem.action(contextMenu.shift!);
                                handleCloseContextMenu();
                            }}
                            disabled={menuItem.disabled && contextMenu.shift ? menuItem.disabled(contextMenu.shift) : false}
                        >
                            <ListItemIcon>
                                {menuItem.icon}
                            </ListItemIcon>
                            <ListItemText>{menuItem.label}</ListItemText>
                        </MenuItem>
                    ))}
                </Menu>
            </TableContainer>
        </Box>
    );
}

const ObserverShiftTable = observer(ShiftTable) as typeof ShiftTable;
export default ObserverShiftTable;
