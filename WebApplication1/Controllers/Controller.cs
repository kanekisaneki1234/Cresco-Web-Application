using Microsoft.AspNetCore.Mvc;
using WebApplication1.Controllers.public_classes;

namespace WebApplication1.Controllers

{
    [ApiController]
    [Route("api/[controller]")]
    public class MainController : ControllerBase
    {
        private readonly IUploadHandler _fileHandler;
        private readonly IHtmlDataHandler _htmlDataHandler;
        private readonly IDocumentHandler _documentHandler;

        public MainController(IUploadHandler fileHandler, IHtmlDataHandler htmlDataHandler, IDocumentHandler documentHandler)
        {
            _fileHandler = fileHandler ?? throw new ArgumentNullException(nameof(fileHandler));
            _htmlDataHandler = htmlDataHandler ?? throw new ArgumentNullException(nameof(htmlDataHandler));
            _documentHandler = documentHandler ?? throw new ArgumentNullException(nameof(documentHandler));
        }

        [HttpPost("Upload")]
        public async Task<IActionResult> UploadFile(IFormFile file, [FromForm] string operation, [FromForm] string? options)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "INVALID_REQUEST",
                        Message = "No file provided",
                        Details = "The request must include a file"
                    }
                });
            }

            if (string.IsNullOrEmpty(operation))
            {
                return BadRequest(new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "INVALID_REQUEST",
                        Message = "No operation specified",
                        Details = "The request must include an operation type"
                    }
                });
            }
            
            try
            {
                options ??= "{}";
                var result = await _fileHandler.Upload(file, operation, options);
                if (result.Status == "error")
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "SYSTEM_ERROR",
                        Message = "An unexpected error occurred",
                        Details = ex.Message
                    }
                });
            }
        }

        [HttpPost("htmlData")]
        public async Task<IActionResult> GetHTMLData([FromForm] string url)
        {
            if (string.IsNullOrEmpty(url))
            {
                // return BadRequest(new { Error });
                return BadRequest(new HTMLResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "INVALID_REQUEST",
                        Message = "No URL provided",
                        Details = "The request must include a URL"
                    }
                });
            }

            try
            {
                var result = await _htmlDataHandler.GetHTML(url);
                if (result.Status == "error")
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new HTMLResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "SYSTEM_ERROR",
                        Message = "An unexpected error occurred",
                        Details = ex.Message
                    }
                });
            }
        }

        [HttpPost("ExtractTables")]
        public async Task<IActionResult> ExtractTables(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "INVALID_REQUEST",
                        Message = "No file provided",
                        Details = "The request must include a document file"
                    }
                });
            }

            try
            {
                var result = await _documentHandler.ExtractTables(file);
                if (result.Status == "error")
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new CleaningResponse
                {
                    Status = "error",
                    Error = new ErrorDetails
                    {
                        Type = "SYSTEM_ERROR",
                        Message = "An unexpected error occurred",
                        Details = ex.Message
                    }
                });
            }
        }
    }
}