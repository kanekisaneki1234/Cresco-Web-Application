import { ReactComponent as CrescoLogo } from "./cresco.svg";
import Papa from "papaparse";
// import CrescoLogo from "./cresco.svg";
import React, { useState} from "react";
import './App.css';
// import FileUpload from "./UploadFile";
import { DataCleaningService } from "./UploadFile";
import { DataInfoService } from "./UploadFile";
import { DataVisualizationService } from "./UploadFile";
import { FileParsingService } from "./UploadFile";

import DownloadOptions from './DownloadOptions';

import DocumentDataHandler from "./DocumentTable";

import HTMLDataHandler from "./HTMLData";
import HTMLTablesDisplay from './HTMLTablesDisplay';
import renderDataVisualization from "./renderDataVisualization";
import ChartConfig from "./chartconfig";
import ChartVisualization from "./ChartVisualization";
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Paper,
  List,
  ListItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  // Checkbox,
  TextField,
  Tooltip,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import TerminalIcon from "@mui/icons-material/Terminal";
import SettingsIcon from "@mui/icons-material/Settings";
import LanguageIcon from '@mui/icons-material/Language';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsightsIcon from '@mui/icons-material/Insights';
// import AnalyticsIcon from '@mui/icons-material/Analytics';
import FileTextIcon from '@mui/icons-material/TextSnippet';

import { Alert, AlertTitle } from '@mui/material';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [responseData, setResponseData] = useState([]);
  const [infoData, setInfoData] = useState([]);
  const [insightData, setInsightData] = useState([]);
  const [visData, setVisData] = useState([]);
  const [visualisationData, setVisualisationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [activeIcon, setActiveIcon] = useState(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [error, setError] = useState(null);
  
  const [cleaningMethod, setCleaningMethod] = useState("dropna");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [fillValue, setFillValue] = useState("");
  const [columns, setColumns] = useState([]);
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [targettype, settarget_type] = useState("str");
  const [limit, setLimit] = useState(null);
  const [replaceConfig, setReplaceConfig] = useState("exact");

  const [HTMLData, setHTMLData] = useState([]);
  const [url, setURL] = useState("");

  const [info_method, setInfoMethod] = useState("both");
  const [targetColumn, setTargetColumn] = useState("");
  const [selectedCol, setSelectedCol] = useState([]);

  const [chartConfig, setChartConfig] = useState({
    chartType: 'pie',
    selectedColumns: [],
    categoryColumn: '',
    columnColors: {},
    chartTitle: ''
  });

  const [documentFile, setDocumentFile] = useState(null);
  const [documentData, setDocumentData] = useState([]);

  const [savedData, setSavedData] = useState(null);
  const [isUsingSavedData, setIsUsingSavedData] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleIconClick = (icon) => {
    if (activeIcon === icon) {
      setIsWindowOpen(!isWindowOpen);
    } else {
      setActiveIcon(icon);
      setIsWindowOpen(true);
    }
  };

  var operation = "";
  if (activeIcon === "DATA INFO") {
    operation = "info";
  } else if (activeIcon === "OPTIONS") {
    operation = "clean";
  } else if (activeIcon === "INSIGHTS") {
    operation = "vis_data";
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      FileParsingService.handleFileChange(file, setSelectedFile, setTableData, setColumns, setError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    let value = null;
    if (cleaningMethod === "replace") {
      value = { oldVal: oldValue, newVal: newValue };
    } else {
      value = fillValue;
    }

    let target_type = "";
    if (cleaningMethod === "replace") {
      target_type = replaceConfig;
    } else {
      target_type = targettype;
    }
    
    if (operation === "clean") {
      const options = {
        method: cleaningMethod,
        column: selectedColumn,
        value: value,
        target_type: target_type,
        limit: limit
      };
      if (isUsingSavedData) {
        const csvContent = Papa.unparse(savedData);
        const savedFile = new File([csvContent], "saved-data.csv", { type: "text/csv" });
        await DataCleaningService.handleCleaningSubmit(savedFile, options, setResponseData, setLoading, setError);
      } else {
        await DataCleaningService.handleCleaningSubmit(selectedFile, options, setResponseData, setLoading, setError);
      }
    } 
    else if (operation === "info") {
      if (isUsingSavedData) {
        const csvContent = Papa.unparse(savedData);
        const savedFile = new File([csvContent], "saved-data.csv", { type: "text/csv" });
        await DataInfoService.handleInfoSubmit(savedFile, setInfoData, setLoading, setError);
      } else {
        await DataInfoService.handleInfoSubmit(selectedFile, setInfoData, setLoading, setError);
      }
    }
    else if (operation === "vis_data") {
      const options = {
        method: info_method,
        target_column: targetColumn,
        selected_cols: selectedCol
      };
      if (isUsingSavedData) {
        const csvContent = Papa.unparse(savedData);
        const savedFile = new File([csvContent], "saved-data.csv", { type: "text/csv" });
        await DataVisualizationService.handleVisualizationSubmit(savedFile, options, setVisData, setLoading, setError);
      } else {
        await DataVisualizationService.handleVisualizationSubmit(selectedFile, options, setVisData, setLoading, setError);
      }
    }
  };

  const handleSaveData = () => {
    if (responseData.length > 0) {
      setSavedData(responseData);
      setIsUsingSavedData(true);
      alert("Data has been saved! Further operations will use this saved data.");
    } else {
      alert("No data to save!");
    }
  };

  const handleResetToOriginal = () => {
    setSavedData(null);
    setIsUsingSavedData(false);
    setResponseData([]);
    alert("Reset to original data. Further operations will use the uploaded file.");
  };

  const handleHTML = async (e) => {
    if (!url) {
      alert("Please enter a URL first!");
      return;
    }
    await HTMLDataHandler.fetchHTMLData(e, url, setLoading, setError, setHTMLData);
  };

  const renderHTMLContent = () => (
    <div className="flex-format" style={{ 
      padding: "16px"
    }}>
      <div>
        <Typography variant="h5" className="typography-content">Extract Tables From Websites</Typography>
      </div>
      <div className="flex-format" style={{ marginTop: "16px", gap: "30px" }}>
        <TextField
          fullWidth
          label="Enter the URL"
          value={url}
          onChange={(e) => setURL(e.target.value)}
          style={{ marginTop: "16px" }}
        />
        <Box className="box-styling"
          onClick={handleHTML}
          disabled={loading}
        >
          {loading ? "Loading..." : "LOAD HTML DATA"}
        </Box>
      </div>
    </div>
  )

  const handleDocumentChange = (e) => {
    e.preventDefault()
    const file = e.target.files[0];
    setDocumentFile(file);
  };

  const renderDocumentExtractor = () => (
    <div className="flex-format" style={{ paddingTop: "16px", gap: '40px' }}>
      <Typography className="typography-content" variant="h5">Extract Tables from Documents</Typography>
      <input
        type="file" 
        onChange={(e) => handleDocumentChange(e)} 
        accept=".pdf,.docx" 
        style={{ marginTop: "16px" }}
      />
      <Box className="box-styling"
        // marginTop={'16px'}
        onClick={() => DocumentDataHandler.handleDocumentSubmit(documentFile, setDocumentData, setError, setLoading)}
        disabled={loading} 
      >
        {loading ? "Loading..." : "Submit"}
      </Box>
    </div>
  );

  const renderDataInfo = () => (
    <div className="flex-format" style={{ 
      marginTop: '20px',
      gap: "40px"
    }}>
        <Typography className="typography-content" variant="h5">Get Info about the Uploaded Data</Typography>
          <Box className="box-styling"
            onClick={handleSubmit}
            disabled={loading}
            // margin={5}
          >
            {loading ? "Loading..." : "LOAD INFO"}
          </Box>
      
    </div>
  )

  const renderOptionsContent = () => (
    <div>
      <div className="formlabel-content">
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{paddingTop: 2, paddingBottom: 2}}>Modify Data</FormLabel>
          <RadioGroup
            value={cleaningMethod}
            onChange={(e) => setCleaningMethod(e.target.value)}
          >
            <Tooltip title="Drop rows containing NA values from the dataset" arrow>
              <FormControlLabel value="dropna" control={<Radio />} label="Drop NA Values" />
            </Tooltip>
            <FormControlLabel value="fillna" control={<Radio />} label="Fill NA with Value" />
            <Tooltip title="Fill NA with Previous Non-NA Value" arrow>
              <FormControlLabel value="ffill" control={<Radio />} label="Forward Fill" />
            </Tooltip>
            <Tooltip title="Fill NA with Next Non-NA Value" arrow>
              <FormControlLabel value="bfill" control={<Radio />} label="Backward Fill" />
            </Tooltip>
            <FormControlLabel value="fillna_mean" control={<Radio />} label="Fill NA with Mean" />
            <FormControlLabel value="fillna_median" control={<Radio />} label="Fill NA with Median" />
            <Tooltip title="Fill NA with the most frequent value in the column. If 'All Columns' option is selected, the most frequent value for each column is assigned to NA values of each column respectively" arrow>
              <FormControlLabel value="fillna_mode" control={<Radio />} label="Fill NA with Mode" />
            </Tooltip>
            <FormControlLabel value="replace" control={<Radio />} label="Replace Values" />
            <FormControlLabel value="typecast" control={<Radio />} label="Typecast Values" />
          </RadioGroup>
        </FormControl>
      </div>

      {columns.length > 0 && (
        <div className="formlabel-content">
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{paddingTop: 3, paddingBottom: 3}}>Select Column (Optional)</FormLabel>
            <RadioGroup
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
            >
              <FormControlLabel value="" control={<Radio />} label="All Columns" />
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

      {(cleaningMethod === "fillna") && (
        <div className="formlabel-content">
          <TextField
            fullWidth
            label="Fill Value (Do not enter None or NaN as values)"
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            style={{ marginTop: "16px", marginBottom: "16px" }}
          />
        </div>
      )}

      {(cleaningMethod === "ffill" || cleaningMethod === "bfill") && (
        <div className="formlabel-content">
          <TextField
            fullWidth
            label="Limit: Select the amount of NA Values to fill"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            style={{ marginTop: "16px" }}
          />
          <p> (Optional: All values are filled if no value specified) </p>
        </div>
      )}

      {(cleaningMethod === "replace") && (
        <div className="formlabel-content">
          <div className="formlabel-content">
            <FormControl component="fieldset">
              <FormLabel component="legend" style={{marginBottom:"20px"}}>Select Replace Method (Optional)</FormLabel>
              <RadioGroup
                value={replaceConfig}
                onChange={(e) => setReplaceConfig(e.target.value)}
              >
                <Tooltip title="Replace Values that Exactly match the given value">
                  <FormControlLabel value="exact" control={<Radio />} label="Replace Exact Matching Values" />
                </Tooltip>
                <Tooltip title="Replace Values that Exactly match the given value">
                  <FormControlLabel value="contains" control={<Radio />} label="Replace Containing Values" />                  
                </Tooltip>
              </RadioGroup>
            </FormControl>              
          </div>
          <div style={{padding:"20px"}}>
            <TextField
              fullWidth
              label="Value to Replace"
              value={oldValue}
              onChange={(e) => setOldValue(e.target.value)}
              // style={{ marginTop: "16px" }}
            />
            <TextField
              fullWidth
              label="New Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              style={{ marginTop: "16px" }}
            />
          </div>
        </div>
      )}

      {(cleaningMethod === "typecast") && (
        <div className="formlabel-content">
          <FormControl fullWidth>
            <InputLabel id="target-type-label">Target Type</InputLabel>
            <Select
              labelId="target-type-label"
              value={targettype}
              label="Target Type"
              onChange={(e) => settarget_type(e.target.value)}
            >
              <MenuItem key="type-int" value="int">Integer (int)</MenuItem>
              <MenuItem key="type-str" value="str">String (str)</MenuItem>
              <MenuItem key="type-bool" value="bool">Boolean (bool)</MenuItem>
              <MenuItem key="type-float" value="float">Float</MenuItem>
            </Select>
          </FormControl>
        </div>
      )}

      <div>
        <Box className="box-styling"
          onClick={handleSubmit}
          disabled={loading}
          marginLeft={6}
          marginTop={3}
        >
          {loading ? "Loading..." : "Upload"}
        </Box>
      </div>
    </div>
  );

  const renderFileBrowserContent = () => (
    <div style={{padding: 20, fontSize: 40}}>
      <p>Might Introduce the ability to Upload Files to a cloud folder in the future.</p>
    </div>
  )

  const ErrorDisplay = ({ error }) => {
    if (!error) return null;
  
    return (
      <Alert 
        severity="error" 
        onClose={() => setError(null)}
        sx={{ 
          position: 'fixed', 
          top: 20, 
          right: 20, 
          zIndex: 9999,
          maxWidth: '400px'
        }}
      >
        <AlertTitle>{error.type}</AlertTitle>
        {error.message}
        {error.details && (
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {error.details}
          </Typography>
        )}
      </Alert>
    );
  };

  const visualizationPanel = renderDataVisualization({
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
  });

  const handleVisualisationData = (data) => {
    setVisualisationData(data);
    setActiveIcon("Data Visualization");
  };

  const handleInsightData = (data) => {
    setInsightData(data);
    setActiveIcon("INSIGHTS");
  };


  return (
    <div className="App">
      <ErrorDisplay error={error} />

      <div>
        <AppBar position="static">
          <Toolbar style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CrescoLogo />
          </Toolbar>
        </AppBar>
      </div>

      <div
        style={{
          height: 60,
          borderBottom: 6,
          // borderBottomColor: "#2196f3",
          borderBottomColor: "#1976d2",
          borderBottomStyle: "solid",
          padding: 20,
        }}
      >
        <Typography variant="h4"
          style={{
            padding: 8,
            color: "#FF7043"
          }}
        >Upload File</Typography>
        {/* for testing purposes */}
        {/* <input
          role="textbox"
          type="file"
          id="file-input"
          data-testid="file-input"
          aria-label="file"
          accept=".csv"
          onChange={handleFileChange}
        /> */}
        <input type="file" onChange={handleFileChange} accept=".csv" />
          {/* for testing purposes */}
          {/* <button role="upload" onClick={handleSubmit} disabled={loading}></button> */} 
          {/* <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </button> */}
      </div>
      
      <div style={{ display: "flex", width: "60px", flexDirection: "column", position: 'absolute', backgroundColor: "#1976d2", height: "862px"}}>
        <List sx={{
              color: "#FF7043",
            }}>
          <ListItem sx={{ cursor: "pointer", "&:hover": {
                backgroundColor: "darkblue"}, backgroundColor: activeIcon === "FILE BROWSER" && isWindowOpen ? "white" : "transparent" }} onClick={() => handleIconClick("FILE BROWSER")}>
            <FolderIcon />
          </ListItem>
          <ListItem sx={{ cursor: "pointer", "&:hover": {
                backgroundColor: "darkblue"}, backgroundColor: activeIcon === "DATA INFO" && isWindowOpen ? "white" : "transparent" }} onClick={() => handleIconClick("DATA INFO")}>
            <TerminalIcon />
          </ListItem>
          <ListItem sx={{ cursor: "pointer", "&:hover": {
                backgroundColor: "darkblue"}, backgroundColor: activeIcon === "OPTIONS" && isWindowOpen ? "white" : "transparent" }} onClick={() => handleIconClick("OPTIONS")}>
            <SettingsIcon />
          </ListItem>
          <ListItem sx={{ cursor: "pointer", "&:hover": {
                backgroundColor: "darkblue"}, backgroundColor: activeIcon === "HTML Extractor" && isWindowOpen ? "white" : "transparent" }} onClick={() => handleIconClick("HTML Extractor")}>
            <LanguageIcon />
          </ListItem>
          <ListItem sx={{ cursor: "pointer", "&:hover": {
                backgroundColor: "darkblue"}, backgroundColor: activeIcon === "INSIGHTS" && isWindowOpen ? "white" : "transparent" }} onClick={() => handleIconClick("INSIGHTS")}>
            <InsightsIcon />
          </ListItem>
          <ListItem sx={{ cursor: "pointer", "&:hover": {
                backgroundColor: "darkblue"}, backgroundColor: activeIcon === "Data Visualization" && isWindowOpen ? "white" : "transparent" }} onClick={() => handleIconClick("Data Visualization")}>
            <BarChartIcon />
          </ListItem>
          <ListItem sx={{ cursor: "pointer", "&:hover": {
                backgroundColor: "darkblue"}, backgroundColor: activeIcon === "Document Tables" && isWindowOpen ? "white" : "transparent" }} onClick={() => handleIconClick("Document Tables")}>
            <FileTextIcon />
          </ListItem>
        </List>

        {isWindowOpen && (
          <Paper
            elevation={0}
            sx={{
              position: "absolute",
              marginLeft: "60px",
              padding: "16px",
              width: "300px",
              height: "100vh",
              overflowY: "auto",
              borderBottom: "10px solid #FF7043",
              borderRight: "5px solid #FF7043",
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 0
            }}
          >
            <Typography variant="h4"
            style={{backgroundColor: "#1976d2", color: "#FF7043", padding: '0px', width: "100%", fontFamily: "monospace"}}>{activeIcon}</Typography>
            {activeIcon === "FILE BROWSER" && renderFileBrowserContent()}
            {activeIcon === "DATA INFO" && renderDataInfo()}
            {activeIcon === "OPTIONS" && renderOptionsContent()}
            {activeIcon === "HTML Extractor" && renderHTMLContent()}
            {activeIcon === "INSIGHTS" && (visualizationPanel)}
            {activeIcon === "Data Visualization" && (
              <ChartConfig 
                data={visualisationData} 
                onConfigChange={(config) => setChartConfig(config)}
              />
            )}
            {activeIcon === "Document Tables" && renderDocumentExtractor()}
          </Paper>
        )}
      </div>

      {/* Tabs Section */}
      <div style={{ display: 'flex', position: 'absolute', top: 206, left: isWindowOpen ? 400 : 60 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider"}}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="file tabs"
            sx={{ height: '48px' }}
          >
            <Tab label="Preview" disabled={!selectedFile} />
            <Tab label="Results" disabled={!selectedFile} />
            <Tab label="Info & Stats" disabled={!infoData.length} />
            <Tab label="HTML Tables" disabled={!HTMLData.length} />
            <Tab label="Insights" disabled={!visData.length} />
            <Tab label="Visualizations" disabled={!visualisationData.length} />
            <Tab label="Document Tables" disabled={!documentData.length} />
          </Tabs>
        </Box>
      </div>

      <div style={{ display: 'flex', position: 'absolute', left: isWindowOpen ? 500 : 168, width: 'fit-content', height: 'fit-content', top: 330, paddingBottom: '60px', paddingRight: "100px" }}>
        <Box>
          {tabValue === 0 && tableData.length > 0 && (
            <div>
              <div className="table-container">
              {/* <h2>Preview of CSV Data:</h2> */}
                <table border="1">
                  <thead>
                    <tr>
                      {Object.keys(tableData[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>  
              <div className="button-div"> 
                <Box className="box-styling"
                  onClick={() => handleInsightData(tableData)}
                >
                  {loading ? "Loading..." : "Get Insights On This Data"}
                </Box>
              </div>        
            </div>
          )}

          {tabValue === 1 && responseData.length > 0 && (
            <div className="flex-format">
              <div>
                {/* <h2>Uploaded CSV Data:</h2> */}
                <table border="1">
                  <thead>
                    <tr>
                      {Object.keys(responseData[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {responseData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="button-div"> 
                <Box 
                  className="box-styling"
                  onClick={handleSaveData}
                  sx={{ 
                    backgroundColor: isUsingSavedData ? '#4caf50' : "#1976d2",
                    color: 'white'
                  }}
                >
                  {isUsingSavedData ? "Update Saved Data" : "Save This Data"}
                </Box>
                {isUsingSavedData && (
                  <Box 
                    className="box-styling"
                    onClick={handleResetToOriginal}
                  >
                    Reset to Original
                  </Box>
                )}
                <Box className="box-styling"
                  onClick={() => handleVisualisationData(responseData)}
                >
                  {loading ? "Loading..." : "Visualise This Data"}
                </Box>
                <Box className="box-styling"
                  onClick={() => handleInsightData(responseData)}
                >
                  {loading ? "Loading..." : "Get Insights On This Data"}
                </Box>
              </div>
              <div>
                <DownloadOptions data={responseData} disabled={!responseData.length} />
              </div>
            </div>
          )}

          {tabValue === 2 && infoData.length > 0 && (
            <div className="flex-format">
              <div>
                <table border="1">
                  <thead>
                    <tr>
                      {Object.keys(infoData[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {infoData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="button-div">
                <Box className="box-styling"
                  onClick={() => handleVisualisationData(infoData)}
                >
                  {loading ? "Loading..." : "Visualise This Data"}
                </Box>
              </div>
              <div>
                <DownloadOptions data={infoData} disabled={!infoData.length} />
              </div>
            </div>
          )}

          {tabValue === 3 && HTMLData.length > 0 && (
            <div>
              <HTMLTablesDisplay htmlData={HTMLData} />
              <DownloadOptions data={HTMLData} disabled={!HTMLData.length} />
            </div>
          )}

          {tabValue === 4 && visData.length > 0 && (
            <div>
              <div className="table-container">
                <table border="1">
                  <thead>
                    <tr>
                      {Object.keys(visData[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{
                padding: "10px"
              }}>
                <DownloadOptions data={visData} disabled={!visData.length} />
                <Box className="box-styling"
                  onClick={() => handleVisualisationData(visData)}
                  // disabled={loading}
                >
                  {loading ? "Loading..." : "Visualise This Data"}
                </Box>
              </div>
            </div>
          )}

          {tabValue === 5 && visualisationData.length > 0 && (
            <div style={{ minWidth: '800px' }}>
              <ChartVisualization 
                data={visualisationData}
                config={chartConfig}
              />
            </div>
          )}

          {tabValue === 6 && documentData.length > 0 && (
            <div className="flex-format">
              {documentData.map((table, tableIndex) => (
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
              <div>
                <DownloadOptions data={documentData} disabled={!documentData.length} />
              </div>
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}

export default App;