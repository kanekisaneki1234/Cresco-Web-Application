using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebApplication1.Controllers.public_classes;

namespace WebApplication1.Tests
{
    [TestClass]
    public class HtmlDataHandlerTests
    {
        private HtmlDataHandler _htmlDataHandler;

        [TestInitialize]
        public void SetUp()
        {
            _htmlDataHandler = new HtmlDataHandler();
        }

        [TestMethod]
        public async Task GetHTML_ShouldReturnError_WhenUrlIsNullOrWhiteSpace()
        {
            // Arrange
            string nullUrl = null;
            string emptyUrl = "  ";

            // Act
            var result1 = await _htmlDataHandler.GetHTML(nullUrl);
            var result2 = await _htmlDataHandler.GetHTML(emptyUrl);

            // Assert
            Assert.AreEqual("error", result1.Status);
            Assert.AreEqual("NO_URL_FOUND", result1.Error.Type);

            Assert.AreEqual("error", result2.Status);
            Assert.AreEqual("NO_URL_FOUND", result2.Error.Type);
        }

        [TestMethod]
        public async Task ExecutePythonScript_ShouldReturnError_WhenScriptPathDoesNotExist()
        {
            // Arrange
            string nonExistentPath = Path.Combine(Directory.GetCurrentDirectory(), "non_existent_script.py");
            string inputUrl = "http://example.com";

            // Act
            var result = await _htmlDataHandler.GetHTML(inputUrl);

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.AreEqual("SYSTEM_ERROR", result.Error.Type);
            // Assert.AreEqual($"Script not found at path: {nonExistentPath}", result.Error.Details);
        }

        [TestMethod]
        public async Task ExecutePythonScript_ShouldReturnError_WhenScriptExecutionFails()
        {
            // Arrange
            string validPath = Path.Combine(Directory.GetCurrentDirectory(), "html_data.py");
            string inputUrl = "http://example.com";

            // Simulate the script not existing.
            if (File.Exists(validPath))
            {
                File.Delete(validPath);
            }

            // Act
            var result = await _htmlDataHandler.GetHTML(inputUrl);

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.AreEqual("SYSTEM_ERROR", result.Error.Type);
        }

        // [TestMethod]
        // public async Task ExecutePythonScript_ShouldReturnError_WhenExitCodeIsNotZero()
        // {
        //     // Arrange
        //     string fakeScriptPath = Path.Combine(Directory.GetCurrentDirectory(), "html_data.py");
        //     string inputUrl = "http://example.com";

        //     // Create a fake Python script that exits with a non-zero exit code.
        //     await File.WriteAllTextAsync(fakeScriptPath, "import sys; sys.exit(1)");

        //     // Act
        //     var result = await _htmlDataHandler.GetHTML(inputUrl);

        //     // Cleanup
        //     if (File.Exists(fakeScriptPath))
        //     {
        //         File.Delete(fakeScriptPath);
        //     }

        //     // Assert
        //     Assert.AreEqual("error", result.Status);
        //     Assert.AreEqual("PARSE_ERROR", result.Error.Type);
        // }

        [TestMethod]
        public async Task ExecutePythonScript_ShouldReturnError_WhenExceptionOccurs()
        {
            // Arrange
            string scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "html_data.py");
            string inputUrl = "http://example.com";

            // Create a fake Python script that causes an exception (invalid Python syntax).
            await File.WriteAllTextAsync(scriptPath, "print('Hello World");

            // Act
            var result = await _htmlDataHandler.GetHTML(inputUrl);

            // Cleanup
            if (File.Exists(scriptPath))
            {
                File.Delete(scriptPath);
            }

            // Assert
            Assert.AreEqual("error", result.Status);
            Assert.AreEqual("EXECUTION_ERROR", result.Error.Type);
        }
    }
}