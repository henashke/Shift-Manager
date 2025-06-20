import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { constraintStore } from '../stores/ConstraintStore';
import CalendarNavigation from './CalendarNavigation';
import DraggableList from './DraggableList';
import { ConstraintType } from './ConstraintTypeList';
import ShiftTable from './ShiftTable';

const constraintTypes = [ConstraintType.CANT, ConstraintType.PREFERS_NOT, ConstraintType.PREFERS];

const ConstraintList: React.FC = observer(() => {
  const [selectedType, setSelectedType] = useState<ConstraintType | null>(null);

  // Drag and drop handlers for constraint types
  const onDragStart = (e: React.DragEvent, type: ConstraintType) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ constraintType: type }));
  };
  // No-op for onDrop/onDragOver for now, can be extended for unassigning constraints

  return (
    <div>
      <CalendarNavigation />
      <div style={{ display: 'flex', gap: 24 }}>
        <DraggableList
          items={constraintTypes}
          getKey={item => item}
          getLabel={item => item}
          onDragStart={onDragStart}
          // No context menu or add button for constraint types for now
        />
        <div style={{ flex: 1 }}>
          <ShiftTable /* TODO: pass props for constraints context if needed */ />
        </div>
      </div>
    </div>
  );
});

export default ConstraintList;
