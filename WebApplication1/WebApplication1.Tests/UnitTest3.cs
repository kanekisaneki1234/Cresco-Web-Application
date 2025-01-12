using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System.Text;
using WebApplication1.Controllers.public_classes;

namespace WebApplication1.Tests
{
    [TestClass]
    public class DocumentHandlerTests
    {
        private DocumentHandler _documentHandler;
        private Mock<IFormFile> _mockFile;
        private string _testFilePath;

        [TestInitialize]
        public void Setup()
        {
            _documentHandler = new DocumentHandler();
            _mockFile = new Mock<IFormFile>();
            _testFilePath = Path.Combine(Directory.GetCurrentDirectory(), "table_extractor.py");
        }

        [TestCleanup]
        public void Cleanup()
        {
            if (File.Exists(_testFilePath))
            {
                try
                {
                    File.Delete(_testFilePath);
                }
                catch (IOException)
                {
                    Task.Delay(100).Wait();
                    File.Delete(_testFilePath);
                }
            }
        }

        private Mock<IFormFile> CreateMockFile(string fileName, string content)
        {
            var mock = new Mock<IFormFile>();
            var bytes = Encoding.UTF8.GetBytes(content);
            var stream = new MemoryStream(bytes);

            mock.Setup(f => f.FileName).Returns(fileName);
            mock.Setup(f => f.Length).Returns(bytes.Length);
            mock.Setup(f => f.OpenReadStream()).Returns(stream);
            mock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                .Callback<Stream, CancellationToken>((stream, token) =>
                {
                    // bytes.CopyTo(stream);
                    stream.Write(bytes, 0, bytes.Length);
                })
                .Returns(Task.CompletedTask);

            return mock;
        }

        [TestMethod]
        public async Task ExtractTables_InvalidFileExtension_ReturnsError()
        {
            // Arrange
            var mockFile = CreateMockFile("test.txt", "test content");

            // Act
            var result = await _documentHandler.ExtractTables(mockFile.Object);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("INVALID_FILE", result.Error.Type);
            Assert.AreEqual("Invalid file extension", result.Error.Message);
            Assert.IsTrue(result.Error.Details.Contains(".pdf"));
            Assert.IsTrue(result.Error.Details.Contains(".docx"));
        }

        [TestMethod]
        public async Task ExtractTables_ScriptNotFound_ReturnsError()
        {
            // Arrange
            var mockFile = CreateMockFile("test.pdf", "test content");
            if (File.Exists(_testFilePath))
            {
                File.Delete(_testFilePath);
            }

            // Act
            var result = await _documentHandler.ExtractTables(mockFile.Object);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("SYSTEM_ERROR", result.Error.Type);
            Assert.AreEqual("Python script not found", result.Error.Message);
            Assert.IsTrue(result.Error.Details.Contains(_testFilePath));
        }

        [TestMethod]
        public async Task ExtractTables_PythonScriptError_ReturnsError()
        {
            // Arrange
            var mockFile = CreateMockFile("test.pdf", "test content");
            string pythonScript = @"
import sys
import json

error_response = {
    'Status': 'error',
    'Error': {
        'Type': 'PYTHON_ERROR',
        'Message': 'Failed to process document',
        'Details': 'Python processing error'
    }
}

print(json.dumps(error_response), file=sys.stderr)
sys.exit(1)
";
            await File.WriteAllTextAsync(_testFilePath, pythonScript);

            // Act
            var result = await _documentHandler.ExtractTables(mockFile.Object);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("PYTHON_ERROR", result.Error.Type);
            Assert.AreEqual("Failed to process document", result.Error.Message);
        }

        [TestMethod]
        public async Task ExtractTables_ProcessStartException_ReturnsError()
        {
            // Arrange
            var mockFile = CreateMockFile("test.pdf", "test content");
            await File.WriteAllTextAsync(_testFilePath, "invalid python syntax");

            // Act
            var result = await _documentHandler.ExtractTables(mockFile.Object);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("PROCESSING_ERROR", result.Error.Type);
            Assert.AreEqual("Failed to process document", result.Error.Message);
        }

        [TestMethod]
        public async Task ExtractTables_NullFile_ReturnsError()
        {
            // Act
            var result = await _documentHandler.ExtractTables(null);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("SYSTEM_ERROR", result.Error.Type);
            Assert.AreEqual("Error processing request", result.Error.Message);
        }
    }
}