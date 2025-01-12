import React, { useState } from 'react';
import DownloadButton from './DownloadButton';

const DownloadOptions = ({ data, disabled = false }) => {
  const [fileType, setFileType] = useState('csv');

  return (
    <div>
      <div>
        <input
          type="radio"
          id="csv"
          value="csv"
          checked={fileType === 'csv'}
          onChange={(e) => setFileType(e.target.value)}
          className="text-blue-600"
        />
        <label htmlFor="csv" className="text-sm font-medium">CSV</label>
      </div>
      
      <div>
        <input
          type="radio"
          id="xlsx"
          value="xlsx"
          checked={fileType === 'xlsx'}
          onChange={(e) => setFileType(e.target.value)}
          className="text-blue-600"
        />
        <label htmlFor="xlsx" className="text-sm font-medium">Excel</label>
      </div>

      <DownloadButton 
        data={data} 
        fileType={fileType} 
        buttonText={`Download as ${fileType.toUpperCase()}`}
        disabled={disabled}
      />
    </div>
  );
};

export default DownloadOptions;