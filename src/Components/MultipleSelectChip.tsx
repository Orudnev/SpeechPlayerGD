import * as React from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

export interface IMultipleSelectProps{
    selectedValues:string[];
    options:string[];
    onSelectionChanged:(value:string[])=>void;
}

export default function MultipleSelect(props:IMultipleSelectProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(props.selectedValues);

  const handleChange = (event: any) => {
    const value = event.target.value;
    setSelectedValues(typeof value === 'string' ? value.split(',') : value);
    props.onSelectionChanged(value);
  };

  return (
    <Select
      multiple
      value={selectedValues}
      onChange={handleChange}
      renderValue={(selected) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((value) => (
            <Chip key={value} label={value} />
          ))}
        </Box>
      )}
      sx={{ minWidth: 200 }}
    >
      {props.options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}  
    </Select>
  );
}