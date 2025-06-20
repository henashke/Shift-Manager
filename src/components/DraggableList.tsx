import React, { useState } from 'react';
import { Box, Paper, Menu, MenuItem } from '@mui/material';

interface DraggableListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onDragStart: (e: React.DragEvent, item: T) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  contextMenuItems?: (item: T, close: () => void) => { label: string, onClick: () => void }[];
  renderAddButton?: () => React.ReactNode;
}

function DraggableList<T>({
  items,
  getKey,
  getLabel,
  onDragStart,
  onDrop,
  onDragOver,
  contextMenuItems,
  renderAddButton
}: DraggableListProps<T>) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, item: T) => {
    event.preventDefault();
    setSelectedItem(item);
    setMenuAnchor(event.currentTarget);
  };

  const closeMenu = () => setMenuAnchor(null);

  return (
    <Paper sx={{mt: 4, p: 2, borderRadius: 2}}
           onDrop={onDrop}
           onDragOver={onDragOver}
    >
      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {renderAddButton && renderAddButton()}
      </Box>
      <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
        {items.map(item => (
          <Box
            key={getKey(item)}
            draggable
            onDragStart={e => onDragStart(e, item)}
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
      {contextMenuItems && selectedItem && (
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
          {contextMenuItems(selectedItem, closeMenu).map((menu, idx) => (
            <MenuItem key={idx} onClick={() => { menu.onClick(); closeMenu(); }}>{menu.label}</MenuItem>
          ))}
        </Menu>
      )}
    </Paper>
  );
}

export default DraggableList;

