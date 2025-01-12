import { Typography } from '@mui/material';
import React from 'react';
import "./App.css";

const HTMLTablesDisplay = ({ htmlData }) => {
  if (!htmlData || !htmlData.length === 0) {
    return (
      <div>
        <p>No HTML tables data available. Please extract tables from a website first.</p>
      </div>
    );
  }

  return (
    <div className='flex-format'>
      {htmlData.map((table, tableIndex) => (
        <div key={tableIndex}>
          <div>
            <Typography variant='h4' className='typography-content'>
              Table {tableIndex + 1}
            </Typography>
          </div>
          
          <div>
            <table border="1">
              <thead>
                <tr>
                  {table.columns && table.columns.map((column, colIndex) => (
                    <th key={colIndex}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.data && table.data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div>
            <p style={{color: "orangered"}}>
              Rows: {table.data ? table.data.length : 0} | 
              Columns: {table.columns ? table.columns.length : 0}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HTMLTablesDisplay;