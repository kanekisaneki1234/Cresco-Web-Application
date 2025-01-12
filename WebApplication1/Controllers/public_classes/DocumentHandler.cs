using System.Diagnostics;
using System.Text.Json;

namespace WebApplication1.Controllers.public_classes
{
    public class DocumentResponse
    {
        public string? Status { get; set; }
        public string? Data { get; set; }  
        public ErrorDetails? Error { get; set; }
    }
    public interface IDocumentHandler
    {
        Task<DocumentResponse> ExtractTables(IFormFile file);
    }

    public class DocumentHandler : IDocumentHandler
    {
        public async Task<DocumentResponse> ExtractTables(IFormFile file)
        {
            try
            {
                List<string> validValues = [".pdf", ".docx"];
                string extension = Path.GetExtension(file.FileName);
                if (!validValues.Contains(extension))
                {
                    return new DocumentResponse
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
                byte[] fileBytes = memoryStream.ToArray();
                
                string base64File = Convert.ToBase64String(fileBytes);
                string fileExtension = Path.GetExtension(file.FileName).ToLower();

                string pythonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "table_extractor.py");

                return await ExecutePythonScript(pythonFilePath, fileExtension, base64File);
            }
            catch (Exception ex)
            {
                return new DocumentResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "SYSTEM_ERROR",
                        Message = $"Error processing request",
                        Details = $"{ex.Message}"
                    }
                };
            }
        }

        private async Task<DocumentResponse> ExecutePythonScript(string scriptPath, string fileExtension, string base64File)
        {
            if (!System.IO.File.Exists(scriptPath))
            {
                return new DocumentResponse
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

            var startInfo = new ProcessStartInfo
            {
                FileName = "python3",
                Arguments = $"{scriptPath} {fileExtension}",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = startInfo };

            try 
            {
                process.Start();
                
                await process.StandardInput.WriteLineAsync(base64File);
                process.StandardInput.Close();

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();
                
                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    var errorResponse = JsonSerializer.Deserialize<DocumentResponse>(error);
                    return errorResponse ?? new DocumentResponse 
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

                return new DocumentResponse
                {
                    Status = "success",
                    Data = output
                };
            }

            catch (Exception ex)
            {
                return new DocumentResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "PROCESSING_ERROR",
                        Message = "Failed to process document",
                        Details = ex.Message
                    }
                };
            }
        }    
    }
}