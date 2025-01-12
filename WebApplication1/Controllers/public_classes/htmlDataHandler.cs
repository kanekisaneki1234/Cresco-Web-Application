using System.Diagnostics;
using System.Text.Json;

namespace WebApplication1.Controllers.public_classes
{
    public class HTMLResponse
    {
        public string? Status { get; set; }
        public string? Data { get; set; }
        public ErrorDetails? Error { get; set; }
    }
    public interface IHtmlDataHandler
    {
        Task<HTMLResponse> GetHTML(string url);
    }

    public class HtmlDataHandler : IHtmlDataHandler
    {
        public async Task<HTMLResponse> GetHTML(string url)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(url))
                {
                    return new HTMLResponse 
                    { 
                        Status = "error", 
                        Error = new ErrorDetails
                        {
                            Type = "NO_URL_FOUND",
                            Message = $"No url provided",
                            Details = $"Please make sure that the url is not null or whitespaces and is valid."
                        } 
                    };
                }

                string pythonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "html_data.py");
                return await ExecutePythonScript(pythonFilePath, url);
            }

            catch (Exception ex)
            {
                return new HTMLResponse
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

        private async Task<HTMLResponse> ExecutePythonScript(string scriptPath, string inputurl)
        {
            if (!File.Exists(scriptPath))
            {
                return new HTMLResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "SYSTEM_ERROR",
                        Message = "Python script not found",
                        Details = $"Script not found at path: {scriptPath}"
                    }
                };
            }

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
            try
            {
                process.Start();
                await process.StandardInput.WriteLineAsync(inputurl);
                process.StandardInput.Close();

                string output = await process.StandardOutput.ReadToEndAsync();
                string error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    var errorResponse = JsonSerializer.Deserialize<HTMLResponse>(error);
                    return errorResponse ?? new HTMLResponse 
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

                return new HTMLResponse
                {
                    Status = "success",
                    Data = output
                };
            }
            catch (Exception ex)
            {
                return new HTMLResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "EXECUTION_ERROR",
                        Message = "Failed to execute Python script",
                        Details = ex.Message
                    }
                };
            }
        }
    }
}