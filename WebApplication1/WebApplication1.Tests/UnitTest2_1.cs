using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebApplication1.Controllers.public_classes;

[TestClass]
public class HtmlDataHandlerTests
{
    private HtmlDataHandler _htmlDataHandler;
    private string _fakeScriptPath;
    private const string TEST_URL = "http://example.com";

    [TestInitialize]
    public void Setup()
    {
        _htmlDataHandler = new HtmlDataHandler();
        _fakeScriptPath = Path.Combine(Directory.GetCurrentDirectory(), "html_data.py");
    }

    [TestCleanup]
    public void Cleanup()
    {
        if (File.Exists(_fakeScriptPath))
        {
            try
            {
                File.Delete(_fakeScriptPath);
            }
            catch (IOException)
            {
                // Handle potential file lock issues
                Task.Delay(100).Wait(); // Brief delay
                File.Delete(_fakeScriptPath);
            }
        }
    }

    [TestMethod]
    public async Task ExecutePythonScript_ShouldReturnError_WhenExitCodeIsNotZero()
    {
        try
        {
            // Arrange
            string pythonScript = @"
import sys
import json

error_response = {
    'Status': 'error',
    'Error': {
        'Type': 'PYTHON_ERROR',
        'Message': 'Test error message',
        'Details': 'Python script failed deliberately'
    }
}

print(json.dumps(error_response), file=sys.stderr)
sys.exit(1)
";
            await File.WriteAllTextAsync(_fakeScriptPath, pythonScript);

            // Act
            var result = await _htmlDataHandler.GetHTML(TEST_URL);

            // Assert
            Assert.IsNotNull(result, "Response should not be null");
            Assert.AreEqual("error", result.Status, "Status should be 'error'");
            Assert.IsNotNull(result.Error, "Error details should not be null");
            Assert.AreEqual("PYTHON_ERROR", result.Error.Type, "Error type should match");
            Assert.AreEqual("Test error message", result.Error.Message, "Error message should match");
            Assert.AreEqual("Python script failed deliberately", result.Error.Details, "Error details should match");
        }
        catch (Exception ex)
        {
            Assert.Fail($"Test failed with exception: {ex.Message}");
        }
    }
}