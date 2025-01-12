import React from 'react';
import ExcelJS from 'exceljs';

const DownloadButton = ({ data, fileType, buttonText = "Download", disabled = false }) => {
  const downloadData = async () => {
    if (!data || data.length === 0) return;

    const isMultipleTables = data[0]?.hasOwnProperty('table_index') || data[0]?.hasOwnProperty('columns');
    
    const normalizedData = isMultipleTables 
      ? data 
      : [{ data: data, columns: Object.keys(data[0]) }];

    if (fileType === 'csv') {
      let csvContent = '';
      
      normalizedData.forEach((table, tableIndex) => {
        
        if (isMultipleTables) {
          if (tableIndex > 0) {
            csvContent += '\n\nTable ' + (tableIndex + 1) + '\n';
          } else {
            csvContent += 'Table ' + (tableIndex + 1) + '\n';
          }
        }

        const headers = table.columns || Object.keys(table.data[0]);
        csvContent += headers.join(',') + '\n';

        const tableData = table.data || table;
        tableData.forEach(row => {
          const rowValues = headers.map(header => {
            let cellData = row[header];
            
            if (typeof cellData !== 'string') {
              return cellData;
            }
            const hasQuotes = cellData.includes('"');
            if (hasQuotes) {
              cellData = cellData.replace(/"/g, '""');
            }
            // return typeof cellData === 'string' && cellData.includes(',') 
            //   ? `${cellData}`
            //   : cellData;
            const needsQuotes = hasQuotes || 
                                cellData.includes(',') || 
                                cellData.includes('\n') ||
                                cellData.includes('\r');
                     
            return needsQuotes ? `"${cellData}"` : cellData;
          });
          csvContent += rowValues.join(',') + '\n';
        });
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } else if (fileType === 'xlsx') {
      const workbook = new ExcelJS.Workbook();

      normalizedData.forEach((table, tableIndex) => {

        const worksheetName = isMultipleTables ? `Table ${tableIndex + 1}` : 'Data';
        const worksheet = workbook.addWorksheet(worksheetName);
        
        const headers = table.columns || Object.keys(table.data[0]);
        
        worksheet.addRow(headers);
        
        const tableData = table.data || table;
        tableData.forEach(row => {
          const rowData = headers.map(header => row[header]);
          worksheet.addRow(rowData);
        });

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.columns.forEach(column => {
          column.width = Math.max(
            ...worksheet.getColumn(column.letter).values
              .map(v => v ? v.toString().length : 0)
          ) + 2;
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `data.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <button 
      onClick={downloadData} 
      disabled={disabled}
      style={{
        padding: '8px 16px',
        margin: '8px',
        backgroundColor: disabled ? '#cccccc' : '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {buttonText}
    </button>
  );
};

export default DownloadButton;