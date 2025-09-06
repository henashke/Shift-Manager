import React from 'react';
import {observer} from 'mobx-react-lite';
import {styled} from "@mui/material";

interface NativeSelectProps {
    title: string;
    options: string[];
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    hideTitleElement?: boolean;
    disabled?: boolean;
}

const StyledSelect = styled("select")(({theme}) => ({
    padding: theme.spacing(1.5, 2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: Number.parseInt(theme.shape.borderRadius.toString()) * 2,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.typography.fontFamily,
    cursor: "pointer",
    boxShadow: theme.shadows[1],
    transition: theme.transitions.create(["border", "box-shadow"], {
        duration: theme.transitions.duration.short,
    }),
}));

const NativeSelect: React.FC<NativeSelectProps> = observer(({title, options, disabled, onChange, hideTitleElement}) => {
    return (
        <StyledSelect onChange={onChange} disabled={disabled}>
            {hideTitleElement ? <></> : <option value="" selected>{title}</option>}
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </StyledSelect>
    );
});

export default NativeSelect;
