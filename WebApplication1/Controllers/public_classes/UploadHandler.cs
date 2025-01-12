using System.Diagnostics;
using System.Text.Json;

namespace WebApplication1.Controllers.public_classes
{
    public interface IUploadHandler 
    { 
        Task<CleaningResponse> Upload(IFormFile file, string operation, string? options=null);
    }

    public class CleaningResponse
    {
        public string? Status { get; set; }
        public string? Data { get; set; }
        public ErrorDetails? Error { get; set; }
    }

    public class ErrorDetails
    {
        public string? Type { get; set; }
        public string? Message { get; set; }
        public string? Details { get; set; }
    }

    public class UploadHandler : IUploadHandler
    {
        private readonly Dictionary<string, string> _operationScripts = new()
        {
            { "info", "info_script.py" },
            { "clean", "cleaning_script.py" },
            { "vis_data", "visualisation_data.py"}
        };
        public async Task<CleaningResponse> Upload(IFormFile file, string operation,  string? options=null)
        {
            List<string> validValues = new List<string>() { ".csv" };
            string extension = Path.GetExtension(file.FileName);
            if (!validValues.Contains(extension))
            {
                return new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "INVALID_FILE",
                        Message = $"Invalid file extension",
                        Details = $"Supported extensions: {string.Join(',', validValues)}"
                    }
                };
            }

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            string fileContent = System.Text.Encoding.UTF8.GetString(memoryStream.ToArray());

            object inputJson;
            if (operation == "info")
            {
                inputJson = new
                {
                    csv_data = fileContent
                };
            }
            else if (operation == "clean" && !string.IsNullOrEmpty(options)) 
            {
                try
                {
                    using var jsonDoc = JsonDocument.Parse(options);
            
                    JsonElement valueElement = jsonDoc.RootElement.GetProperty("value");
                    object? value = null;
            
                    if (valueElement.ValueKind == JsonValueKind.Object)
                    {
                        value = new
                        {
                            oldVal = valueElement.GetProperty("oldVal").GetString(),
                            newVal = valueElement.GetProperty("newVal").GetString()
                        };
                    }
                    else if (valueElement.ValueKind != JsonValueKind.Null)
                    {
                        value = valueElement.GetString();
                    }
            
                    inputJson = new
                    {
                        csv_data = fileContent,
                        method = jsonDoc.RootElement.GetProperty("method").GetString(),
                        column = jsonDoc.RootElement.GetProperty("column").GetString(),
                        value = value,
                        target_type = jsonDoc.RootElement.GetProperty("target_type").GetString(),
                        limit = jsonDoc.RootElement.GetProperty("limit").GetString()
                    };
                }
                catch (Exception ex)
                {
                    return new CleaningResponse
                    {
                        Status = "error",
                        Error = new ErrorDetails
                        {
                            Type = "INVALID_JSON_OR_OPTIONS",
                            Message = "Invalid JSON format or options",
                            Details = ex.Message
                        }
                    };
                }
            }
            else if (operation == "vis_data" && !string.IsNullOrEmpty(options))
            {
                try
                {
                    inputJson = new
                    {
                        csv_data = fileContent,
                        method = JsonDocument.Parse(options).RootElement.GetProperty("method").GetString(),
                        target_column = JsonDocument.Parse(options).RootElement.GetProperty("target_column").GetString(),
                        selected_cols = JsonDocument.Parse(options).RootElement.GetProperty("selected_cols")
                        .EnumerateArray()
                        .Select(element => element.GetString())
                        .ToList()
                    };
                }
                catch (Exception ex)
                {
                    return new CleaningResponse
                    {
                        Status = "error",
                        Error = new ErrorDetails
                        {
                            Type = "INVALID_JSON_OR_OPTIONS",
                            Message = "Invalid JSON format or options",
                            Details = ex.Message
                        }
                    };
                }
            }
            else
            {
                return new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "INVALID_OPERATION",
                        Message = "Invalid operation or missing options",
                        Details = $"Operation: {operation}, Options provided: {options != null}"
                    }
                };
            }

            if (!_operationScripts.TryGetValue(operation, out string? scriptName))
            {
                return new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "INVALID_OPERATION",
                        Message = "Unknown operation",
                        Details = $"Operation: {operation}"
                    }
                };
            }

            string pythonFilePath = Path.Combine(Directory.GetCurrentDirectory(), scriptName);
            return await ExecutePythonScript(pythonFilePath, System.Text.Json.JsonSerializer.Serialize(inputJson));
        }

        private async Task<CleaningResponse> ExecutePythonScript(string scriptPath, string inputJson)
        {
            if (!System.IO.File.Exists(scriptPath))
            {
                return new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "SYSTEM_ERROR",
                        Message = "Python script not found",
                        Details = $"Script path: {scriptPath}"
                    }
                };
            }

            try
            {
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = "python3",
                    Arguments = scriptPath,
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = new Process { StartInfo = processStartInfo };
                process.Start();

                await process.StandardInput.WriteAsync(inputJson);
                process.StandardInput.Close();

                string output = await process.StandardOutput.ReadToEndAsync();
                string error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (!string.IsNullOrEmpty(error))
                {
                    var errorResponse = JsonSerializer.Deserialize<CleaningResponse>(error);
                    return errorResponse ?? new CleaningResponse 
                    { 
                        Status = "error",
                        Error = new ErrorDetails 
                        {
                            Type = "PARSE_ERROR",
                            Message = "Failed to parse error response",
                            Details = error
                        }
                    };
                }

                var successResponse = JsonSerializer.Deserialize<CleaningResponse>(output);
                return successResponse ?? new CleaningResponse 
                { 
                    Status = "error",
                    Error = new ErrorDetails 
                    {
                        Type = "PARSE_ERROR",
                        Message = "Failed to parse success response",
                        Details = output
                    }
                };
            }
            catch (Exception ex)
            {
                return new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "SYSTEM_ERROR",
                        Message = "Error executing Python script",
                        Details = ex.Message
                    }
                };
            }
        }
    }   
}