import axios from "axios";
import Papa from "papaparse";

class FileUploadService {
  static async uploadFile(file, operation, options = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("operation", operation);
    formData.append("options", JSON.stringify(options));

    try {
      const response = await axios.post("http://localhost:5058/api/Main/Upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.Status === "error") {
        throw response.data.Error;
      }

      if (!response.data.data) {
        throw new Error(
          JSON.stringify({
            type: "RESPONSE_ERROR",
            message: "Invalid response format",
            details: "Response data is missing",
          })
        );
      }

      return new Promise((resolve, reject) => {
        Papa.parse(response.data.data, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject({
                type: "PARSE_ERROR",
                message: "Failed to parse response data",
                details: results.errors.map(err => err.message).join(", ")
              });
              return;
            }
            resolve(results.data);
          },
          error: (error) => {
            reject({
              type: "PARSE_ERROR",
              message: "Failed to parse response data",
              details: error.message
            });
          }
        });
      });
    } catch (err) {
      throw (err.response?.data?.error || {
        type: "NETWORK_ERROR",
        message: "Failed to upload file",
        details: err.message
      });
    }
  }

  static parseFile(file) {
    return new Promise((resolve, reject) => {
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      
      if (file.size > MAX_FILE_SIZE) {
        reject({
          type: "FILE_SIZE_ERROR",
          message: "File too large",
          details: `Maximum file size is 100MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
        });
        return;
      }

      if (!file.name.endsWith('.csv')) {
        reject({
          type: "FILE_TYPE_ERROR",
          message: "Invalid file type",
          details: "Only CSV files are supported"
        });
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          if (results.errors.length > 0) {
            reject({
              type: "PARSE_ERROR",
              message: "Failed to parse CSV file",
              details: results.errors.map(err => err.message).join(", ")
            });
            return;
          }
          resolve(results.data);
        },
        error: (error) => {
          reject({
            type: "FILE_ERROR",
            message: "Failed to read file",
            details: error.message
          });
        }
      });
    });
  }
}

export class DataCleaningService {
  static async handleCleaningSubmit(file, cleaningOptions, setResponseData, setLoading, setError) {
    try {
      setLoading(true);
      const data = await FileUploadService.uploadFile(file, "clean", cleaningOptions);
      setResponseData(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }
}

export class DataInfoService {
  static async handleInfoSubmit(file, setInfoData, setLoading, setError) {
    try {
      setLoading(true);
      const data = await FileUploadService.uploadFile(file, "info");
      setInfoData(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }
}

export class DataVisualizationService {
  static async handleVisualizationSubmit(file, visualizationOptions, setVisData, setLoading, setError) {
    try {
      setLoading(true);
      const data = await FileUploadService.uploadFile(file, "vis_data", visualizationOptions);
      setVisData(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }
}

export class FileParsingService {
  static async handleFileChange(file, setSelectedFile, setTableData, setColumns, setError) {
    try {
      const data = await FileUploadService.parseFile(file);
      setSelectedFile(file);
      setTableData(data);
      if (data.length > 0) {
        setColumns(Object.keys(data[0]));
      }
      setError(null);
    } catch (error) {
      setError(error);
    }
  }
}