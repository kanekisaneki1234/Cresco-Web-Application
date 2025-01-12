using System.Text.Json;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using WebApplication1.Controllers.public_classes;

namespace WebApplication1.Tests
{
    [TestClass]
    public class UploadHandlerTests
    {
        private UploadHandler _uploadHandler;

        [TestInitialize]
        public void Setup()
        {
            _uploadHandler = new UploadHandler();
        }

        [TestMethod]
        public async Task Upload_InvalidFileExtension_ReturnsErrorResponse()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.txt");
            
            // Act
            var result = await _uploadHandler.Upload(fileMock.Object, "info");

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("INVALID_FILE", result.Error.Type);
            Assert.IsTrue(result.Error.Details.Contains(".csv"));
        }

        [TestMethod]
        public async Task Upload_InvalidOperation_ReturnsErrorResponse()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.csv");
            
            // Act
            var result = await _uploadHandler.Upload(fileMock.Object, "invalid_operation");

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("INVALID_OPERATION", result.Error.Type);
        }

        [TestMethod]
        public async Task Upload_MissingOptionsForCleanOperation_ReturnsErrorResponse()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.csv");

            // Act
            var result = await _uploadHandler.Upload(fileMock.Object, "clean");

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("INVALID_OPERATION", result.Error.Type);
        }

        [TestMethod]
        public async Task Upload_PythonScriptNotFound_ReturnsErrorResponse()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.csv");

            var options = JsonSerializer.Serialize(new
            {
                method = "replace",
                column = "Name",
                value = new { oldVal = "John", newVal = "Doe" },
                target_type = "string",
                limit = "10"
            });

            // Act
            var result = await _uploadHandler.Upload(fileMock.Object, "clean", options);

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("SYSTEM_ERROR", result.Error.Type);
            Assert.IsTrue(result.Error.Message.Contains("not found"));
        }

        [TestMethod]
        public async Task Upload_InvalidJsonOptions_ReturnsErrorResponse()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.csv");
            
            var invalidOptions = "{ invalid_json }";

            // Act
            var result = await _uploadHandler.Upload(fileMock.Object, "clean", invalidOptions);

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("INVALID_JSON_OR_OPTIONS", result.Error.Type);
        }

        [TestMethod]
        public async Task Upload_PythonScriptExecutionError_ReturnsErrorResponse()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.csv");

            var options = JsonSerializer.Serialize(new
            {
                method = "replace",
                column = "Name",
                value = new { oldVal = "John", newVal = "Doe" },
                target_type = "string",
                limit = "10"
            });

            // Simulate Python script error by providing an invalid path
            // string invalidScriptPath = "invalid_script.py";

            var uploadHandler = new UploadHandler();

            // Act
            var result = await uploadHandler.Upload(fileMock.Object, "clean", options);

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("SYSTEM_ERROR", result.Error.Type);
        }
    }
}
