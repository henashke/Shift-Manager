import React, {useState} from 'react';
import {Box, Menu, MenuItem, Paper} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface DraggableListProps<T> {
    items: T[];
    getKey: (item: T) => string;
    getLabel: (item: T) => string;
    onDragStart: (e: React.DragEvent, item: T) => void;
    onDrop?: (e: React.DragEvent) => void;
    contextMenuItems?: (item: T, close: () => void) => { label: string, onClick: () => void }[];
    onItemClick?: (item: T) => void;
    renderAddButton?: () => React.ReactNode;
    isDragged?: boolean;
}

function DraggableList<T>({
                              items,
                              getKey,
                              getLabel,
                              onDragStart,
                              onDrop,
                              contextMenuItems,
                              onItemClick,
                              renderAddButton,
                              isDragged
                          }: DraggableListProps<T>) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, item: T) => {
        event.preventDefault();
        setSelectedItem(item);
        setMenuAnchor(event.currentTarget);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (onDrop) {
            e.preventDefault();
            setIsDragOver(true);
        }
    };
    const handleDragLeave = () => {
        setIsDragOver(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        setIsDragOver(false);
        if (onDrop) onDrop(e);
    };

    return (
        <Paper sx={{p: 2, borderRadius: 2, position: 'relative', flexGrow: 1}}>
            {isDragged && onDrop ? (
                <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                        height: 180,
                        border: '2px dashed',
                        borderColor: isDragOver ? 'error.main' : 'grey.400',
                        background: isDragOver ? 'rgba(255,0,0,0.08)' : 'transparent',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDragOver ? 'error.main' : 'text.secondary',
                        transition: 'all 0.2s',
                        minHeight: 64,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '1.1em',
                    }}
                >
                    <DeleteIcon sx={{mr: 1, color: isDragOver ? 'error.main' : 'inherit', fontSize: 40}}/>
                    גרור לכאן כדי למחוק
                </Box>
            ) : (
                <>
                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        {renderAddButton && renderAddButton()}
                    </Box>
                    <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                        {items.map(item => (
                            <Box
                                key={getKey(item)}
                                draggable
                                onDragStart={e => onDragStart(e, item)}
                                onClick={onItemClick ? () => onItemClick(item) : undefined}
                                onContextMenu={contextMenuItems ? e => handleContextMenu(e, item) : undefined}
                                sx={{
                                    background: theme => theme.palette.primary.main,
                                    color: 'common.white',
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    fontSize: '1.08em',
                                    cursor: 'grab',
                                    boxShadow: 2,
                                    userSelect: 'none',
                                    transition: 'box-shadow 0.2s, transform 0.2s',
                                    '&:active': {
                                        background: theme => theme.palette.primary.dark,
                                        color: 'common.white',
                                        boxShadow: 4,
                                        transform: 'scale(0.97)',
                                    },
                                    '&:hover': {
                                        boxShadow: 6,
                                        transform: 'scale(1.04)',
                                        cursor: 'pointer',
                                    },
                                }}
                            >
                                {getLabel(item)}
                            </Box>
                        ))}
                    </Box>
                </>
            )}
            {contextMenuItems && selectedItem && (
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                    {contextMenuItems(selectedItem, () => setMenuAnchor(null)).map((menu, idx) => (
                        <MenuItem key={idx} onClick={() => {
                            menu.onClick();
                            setMenuAnchor(null);
                        }}>{menu.label}</MenuItem>
                    ))}
                </Menu>
            )}
        </Paper>
    );
}

export default DraggableList;
