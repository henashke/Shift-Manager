import React from 'react';
import {List, ListItem, ListItemButton, ListItemText} from '@mui/material';

interface GenericListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  selected: T | null;
  onSelect: (item: T) => void;
}

function GenericList<T>({ items, getKey, getLabel, selected, onSelect }: GenericListProps<T>) {
  return (
    <List>
      {items.map(item => (
        <ListItem key={getKey(item)} disablePadding>
          <ListItemButton selected={selected === item} onClick={() => onSelect(item)}>
            <ListItemText primary={getLabel(item)} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

export default GenericList;

