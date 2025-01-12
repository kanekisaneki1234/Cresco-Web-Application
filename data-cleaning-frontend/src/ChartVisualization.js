import React from 'react';
import {
  PieChart, Pie, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

const ChartVisualization = ({ data, config }) => {
  const { chartType, selectedColumns, categoryColumn, columnColors, chartTitle } = config;

  if (!data || !categoryColumn || selectedColumns.length === 0) {
    return <div>Please configure chart settings</div>;
  }

  const calculatePieData = () => {
    const total = data.reduce((sum, item) => sum + Number(item[selectedColumns[0]]), 0);
    return data.map(item => ({
      name: item[categoryColumn],
      value: Number(item[selectedColumns[0]]),
      percentage: ((Number(item[selectedColumns[0]]) / total) * 100).toFixed(1)
    }));
  };

  const calculateWidth = () => {
    const labelCount = data.length; 
    const widthPerLabel = 100; 
    const minWidth = 800; 
    const maxWidth = 2500; 

    return Math.min(Math.max(labelCount * widthPerLabel, minWidth), maxWidth);
  };

  const chartWidth = calculateWidth();

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        const pieData = calculatePieData();
        return (
          <PieChart width={800} height={500}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
              outerRadius={220}
              // fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}-${entry.name}`} 
                  fill={defaultColors[index % defaultColors.length]} 
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case 'bar':
        return (
          <BarChart width={chartWidth} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryColumn} />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedColumns.map((column, index) => (
              <Bar
                key={`bar-${index}-${column}`}
                dataKey={column}
                fill={columnColors[column]}
                name={column}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart width={chartWidth} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryColumn} />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedColumns.map((column, index) => (
              <Line
                key={`line-${index}-${column}`}
                type="monotone"
                dataKey={column}
                stroke={columnColors[column]}
                name={column}
              />
            ))}
          </LineChart>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ width: `${chartWidth}px`, height: '100%' }}>
      {chartTitle && (
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{chartTitle}</h3>
      )}
      <ResponsiveContainer width="100%" height = {chartType==='pie' ? 600 : 400}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartVisualization;