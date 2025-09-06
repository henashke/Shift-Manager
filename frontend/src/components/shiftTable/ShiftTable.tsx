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
import store, {Shift, ShiftType} from '../../stores/ShiftStore';
import AssignToShiftDialog from '../dialogs/AssignToShiftDialog';
import AddIcon from '@mui/icons-material/Add';
import ShiftTableActions from './ShiftTableActions';
import authStore from '../../stores/AuthStore';
import notificationStore from '../../stores/NotificationStore';
import DeleteIcon from "@mui/icons-material/Delete";
import {formatDate} from "./CalendarNavigation";

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const shiftTypes = ['יום', 'לילה'] as const;

interface ShiftTableProps<T> {
    retrieveItemFromShift: (shift: Shift) => T | undefined;
    getItemName: (item: T, shift?: Shift) => string;
    getItemElement?: (item: T, shift: Shift) => JSX.Element;
    assignHandler: (shift: Shift, item: T) => void;
    unassignHandler: (shift: Shift) => void;
    itemList: T[];
    isPendingItems?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    retrievePendingItem?: (shift: Shift) => T | undefined;
    onDropHandler?: (e: React.DragEvent, shift: Shift) => void;
    onDragEndHandler?: () => void;
    onDragStartHandler?: (e: React.DragEvent, draggedElement: T, fromShift?: Shift) => void;
    itemName: string;
    requireAdmin?: boolean;
    isRemoveItemDisabled?: (shift: Shift) => boolean;
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
                           getItemElement,
                           assignHandler,
                           unassignHandler,
                           itemList,
                           isPendingItems,
                           onSave,
                           onCancel,
                           retrievePendingItem,
                           onDropHandler,
                           onDragStartHandler,
                           onDragEndHandler,
                           itemName,
                           isRemoveItemDisabled,
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);


    const onDrop = (e: React.DragEvent, shift: Shift) => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        onDropHandler?.(e, shift);
        onDragEndHandler && onDragEndHandler();
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
        <TableCell sx={{backgroundColor: isToday(date) ? theme.palette.background.default : undefined}}
                   key={'header-' + formatDate(date)}
                   align="center">
            <Typography variant={"h6"}>{days[date.getDay()]}</Typography>
            <Typography>{date.toLocaleDateString('he-IL', {
                day: 'numeric',
                month: 'numeric'
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
            {shiftTypes.map((shiftType) => (
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

    const isToday = (date: Date) => {
        return date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
    }

    const getDefaultItemElement = (item: T, shift: Shift) => {
        const isPending = retrievePendingItem?.(shift) !== undefined;
        return <Box sx={{
            background: theme => isPending ? theme.palette.secondary.main : theme.palette.primary.main,
            color: 'common.white',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
        }}>
            {getItemName(item, shift)}
        </Box>
    }

    const renderItemElement = (item: T, shift: Shift) => {
        return getItemElement ? getItemElement(item, shift) : getDefaultItemElement(item, shift);
    }

    const createTableCell = (date: Date, shiftType: ShiftType) => {
        const shift = {date: date, type: shiftType};
        const item = getPendingOrAssignedItem(shift);
        return (
            <TableCell
                key={'table-cell-' + formatDate(date) + shiftType}
                align="center"
                onDrop={e => onDrop(e, shift)}
                onDragOver={onDragOver}
                onClick={(e) => shift && isAllContextMenuDisabledButAddItem(shift) ? handleCellClick(shift) : handleContextMenu(e, shift)}
                onContextMenu={e => shift && handleContextMenu(e, shift)}
                sx={{
                    minHeight: 48,
                    color: 'common.white',
                    cursor: 'pointer',
                    backgroundColor: isToday(date) ? theme.palette.background.default : undefined
                }}
            >
                {item ? (
                    <Box
                        key={"assigned-" + formatDate(date) + shiftType}
                        draggable
                        onDragStart={e => onDragStart(e, item, shift)}
                        onDragEnd={onDragEndHandler}
                    >
                        {renderItemElement(item, shift)}
                    </Box>
                ) : (
                    <Typography variant="body1" sx={{color: '#7d7bf2'}}>{"שבץ " + itemName}</Typography>
                )}
            </TableCell>
        );
    }

    const VerticalTableBody = () => <TableBody>
        {weekDates.map((date) => (
            <TableRow key={'table-row-' + formatDate(date)}>
                <WeekDayHeaderTableCell date={date}/>
                {shiftTypes.map(shiftType => createTableCell(date, shiftType))}
            </TableRow>
        ))}
    </TableBody>

    const HorizontalTableBody = () => <TableBody>
        {shiftTypes.map((shiftType,) => (
            <TableRow key={shiftType}>
                <ShiftTypeHeaderTableCell shiftType={shiftType}/>
                {weekDates.map((date) => createTableCell(date, shiftType))}
            </TableRow>
        ))}
    </TableBody>

    const tableBody = isNarrowScreen ? <VerticalTableBody/> : <HorizontalTableBody/>

    const isAllContextMenuDisabledButAddItem = (shift: Shift) => {
        if (isRemoveItemDisabled === undefined || !(isRemoveItemDisabled(shift))) {
            return false
        }
        if (additionalContextMenuItems) {
            for (const menuItem of additionalContextMenuItems) {
                if (menuItem.disabled !== undefined && !menuItem.disabled(shift)) {
                    return false
                }
            }
        }
        return true
    }

    return (

        <Box sx={{display: 'flex', gap: 2, height: '100%', mb: 4, flexDirection: isNarrowScreen ? 'column' : 'row'}}>
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
                    itemTitle={itemName}
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
                            <AddIcon color={'success'} fontSize="small"/>
                        </ListItemIcon>
                        <ListItemText>שבץ {itemName}</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleRemoveItem}
                              disabled={isRemoveItemDisabled && isRemoveItemDisabled(contextMenu?.shift!)}
                    >
                        <ListItemIcon>
                            <DeleteIcon color={'error'} fontSize="small"/>
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

export function stringToColor(str: string): string {
    // Hash string → number
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let hue = Math.abs(hash) % 360;

    // Skip the light green band (70–160°)
    if (hue >= 70 && hue <= 110) {
        hue = (hue + 120) % 360; // push it well away
    }

    // Slightly broader saturation & lightness for more diversity
    const sat = 45 + (Math.abs(hash >> 2) % 50);   // 45–95%
    const light = 30 + (Math.abs(hash >> 4) % 30); // 30–70%

    return `hsl(${hue}, ${sat}%, ${light}%)`;
}

const ObserverShiftTable = observer(ShiftTable) as typeof ShiftTable;
export default ObserverShiftTable;
