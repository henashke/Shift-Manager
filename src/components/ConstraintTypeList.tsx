import React from 'react';
import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';

export enum ConstraintType {
  CANT = 'לא יכול',
  PREFERS_NOT = 'מעדיף שלא',
  PREFERS = 'מעדיף'
}

interface ConstraintTypeListProps {
  selected: ConstraintType | null;
  onSelect: (type: ConstraintType) => void;
}

const ConstraintTypeList: React.FC<ConstraintTypeListProps> = ({ selected, onSelect }) => (
  <List>
    {Object.entries(ConstraintType).map(([key, label]) => (
      <ListItem key={key} disablePadding>
        <ListItemButton selected={selected === ConstraintType[key as keyof typeof ConstraintType]} onClick={() => onSelect(ConstraintType[key as keyof typeof ConstraintType])}>
          <ListItemText primary={label} />
        </ListItemButton>
      </ListItem>
    ))}
  </List>
);

export default ConstraintTypeList;

