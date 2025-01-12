import React from 'react';
import { Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Checkbox, Box } from '@mui/material';
import "./App.css";

const renderDataVisualization = ({ 
  insightData, 
  columns, 
  info_method, 
  setInfoMethod, 
  targetColumn, 
  setTargetColumn,
  selectedCol,
  setSelectedCol,
  handleSubmit,
  loading 
}) => {
  // Helper function to check if a string is numeric
  const isNumeric = (value) => {
    if (!value || value.trim() === '') return false;
    const cleanValue = value.replace(/,/g, '').trim();
    const parsed = parseFloat(cleanValue);
    if (!isNaN(parsed)) {
      return String(parsed) === cleanValue || Number(cleanValue) === parsed;
    }
    return false;
  };

  // Function to check if a column is numeric
  const isNumericColumn = (column) => {
    const values = insightData
      .map(row => row[column])
      .filter(val => val !== null && val !== undefined && val !== '');
    
    if (values.length === 0) return false;
    
    const numericCount = values.filter(val => isNumeric(val)).length;
    return (numericCount / values.length) >= 0.8;
  };

  return (
    <div>
      <Typography className="typography-content" variant="h6">Get Insights on Data</Typography>
      <div className="formlabel-content">
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{paddingTop: 2, paddingBottom: 2}}>Method</FormLabel>
          <RadioGroup
            value={info_method}
            onChange={(e) => setInfoMethod(e.target.value)}
          >
            <FormControlLabel value="sum" control={<Radio />} label="Sum" />
            <FormControlLabel value="mean" control={<Radio />} label="Mean" />
            <FormControlLabel value="both" control={<Radio />} label="Both" />
          </RadioGroup>
        </FormControl>
      </div>

      {columns.length > 0 && (
        <div className='formlabel-content'>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{paddingTop: 2, paddingBottom: 2}}>Target Column</FormLabel>
            <RadioGroup
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
            >
              {columns.map((column) => (
                <FormControlLabel
                  key={column}
                  value={column}
                  control={<Radio />}
                  label={column}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </div>
      )}

      {columns.length > 0 && (
        <div className='formlabel-content'>
          <FormControl component="fieldset" style={{ width: "100%" }}>
            <FormLabel component="legend">Selected Columns</FormLabel>
            <div style={{ marginTop: "8px" }}>
              {columns
                .filter(isNumericColumn)
                .map((column) => (
                  <FormControlLabel
                    key={column}
                    control={
                      <Checkbox
                        checked={selectedCol.includes(column)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCol([...selectedCol, column]);
                          } else {
                            setSelectedCol(selectedCol.filter(col => col !== column));
                          }
                        }}
                      />
                    }
                    label={column}
                  />
                ))}
            </div>
          </FormControl>
        </div>
      )}

      <Box className="box-styling"
        onClick={handleSubmit}
        disabled={loading}
        marginLeft={6}
        marginTop={3}
      >
        {loading ? "Loading..." : "Get Insights"}
      </Box>
    </div>
  );
};

export default renderDataVisualization;