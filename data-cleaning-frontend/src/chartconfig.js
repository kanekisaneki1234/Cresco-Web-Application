import React, { useState, useEffect, useCallback } from 'react';
import "./App.css";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography
} from '@mui/material';

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

const ChartConfig = ({ data, onConfigChange }) => {
  const [chartType, setChartType] = useState('pie');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [categoryColumn, setCategoryColumn] = useState('');
  const [columnColors, setColumnColors] = useState({});
  const [chartTitle, setChartTitle] = useState('');

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
  const numericalColumns = columns.filter(column => 
    !isNaN(data[0][column]) && typeof data[0][column] !== 'boolean'
  );

  const updateConfig = useCallback(() => {
    const newColumnColors = {};
    selectedColumns.forEach((col, index) => {
      newColumnColors[col] = columnColors[col] || defaultColors[index % defaultColors.length];
    });
    setColumnColors(newColumnColors);

    onConfigChange({
      chartType,
      selectedColumns,
      categoryColumn,
      columnColors: newColumnColors,
      chartTitle
    });
  }, [chartType, selectedColumns, categoryColumn, chartTitle, columnColors, onConfigChange]);

  useEffect(() => {
    updateConfig();
  }, [updateConfig]);

  const handleColumnColorChange = (column, color) => {
    const newColors = { ...columnColors, [column]: color };
    setColumnColors(newColors);
    onConfigChange({
      chartType,
      selectedColumns,
      categoryColumn,
      columnColors: newColors,
      chartTitle
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography className='typography-content' variant='h5' mb={5}>Chart Configuration</Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="chart-type-label">Chart Type</InputLabel>
        <Select
          labelId="chart-type-label"
          value={chartType}
          label="Chart Type"
          onChange={(e) => setChartType(e.target.value)}
        >
          <MenuItem key="pie-chart" value="pie">Pie Chart</MenuItem>
          <MenuItem key="bar-chart" value="bar">Bar Chart</MenuItem>
          <MenuItem key="line-chart" value="line">Line Chart</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="category-column-label">Category Column</InputLabel>
        <Select
          labelId="category-column-label"
          value={categoryColumn}
          label="Category Column"
          onChange={(e) => setCategoryColumn(e.target.value)}
        >
          {columns.map((col, index) => (
            <MenuItem key={`category-${index}-${col}`} value={col}>{col}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="value-columns-label">Value Columns</InputLabel>
        <Select
          labelId="value-columns-label"
          multiple
          value={selectedColumns}
          label="Value Columns"
          onChange={(e) => setSelectedColumns(e.target.value)}
        >
          {numericalColumns.map((col, index) => (
            <MenuItem key={`value-${index}-${col}`} value={col}>
              {selectedColumns.includes(col) && (
                <Box component="span" sx={{ mr: 1 }}>
                  ✅
                </Box>
              )}
              {col}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Chart Title"
        value={chartTitle}
        onChange={(e) => setChartTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      {chartType!=='pie' && (
      <>
        {selectedColumns.map((column, index) => (
          <Box key={`color-selector-${index}-${column}`} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ mr: 2 }}>{column}</Typography>
            <input
              type="color"
              value={columnColors[column] || defaultColors[0]}
              onChange={(e) => handleColumnColorChange(column, e.target.value)}
            />
          </Box>
        ))}
      </>
      )}
    </Box>
  );
};

export default ChartConfig;