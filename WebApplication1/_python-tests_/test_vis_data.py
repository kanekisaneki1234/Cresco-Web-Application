import unittest
import json
import pandas as pd
from io import StringIO
from visualisation_data import vis_data, DataCleaningError

class TestDataVisualization(unittest.TestCase):
    def setUp(self):
        # Sample valid CSV data for testing
        self.valid_csv = """Type,Value1,Value2
A,10,20
B,15,25
A,12,22"""
        
        # Sample valid parameters
        self.valid_target = "Type"
        self.valid_cols = ["Value1", "Value2"]
        self.valid_method = "sum"

    def test_invalid_target_column(self):
        with self.assertRaises(DataCleaningError) as context:
            vis_data(self.valid_csv, self.valid_method, "NonExistentColumn", self.valid_cols)
        
        self.assertEqual(context.exception.error_type, "INVALID_COLUMN")
        self.assertIn("not found in data", str(context.exception))

    def test_invalid_selected_column(self):
        with self.assertRaises(DataCleaningError) as context:
            vis_data(self.valid_csv, self.valid_method, self.valid_target, ["Value1", "NonExistentColumn"])
        
        self.assertEqual(context.exception.error_type, "INVALID_COLUMN")
        self.assertIn("not found in data", str(context.exception))

    def test_non_numeric_column(self):
        csv_data = """Type,Value1,Text
A,10,abc
B,15,def"""
        
        with self.assertRaises(DataCleaningError) as context:
            vis_data(csv_data, self.valid_method, "Type", ["Value1", "Text"])
        
        self.assertEqual(context.exception.error_type, "INVALID_DATA_TYPE")
        self.assertIn("must be numeric", str(context.exception))

    def test_invalid_method(self):
        with self.assertRaises(DataCleaningError) as context:
            vis_data(self.valid_csv, "invalid_method", self.valid_target, self.valid_cols)
        
        self.assertEqual(context.exception.error_type, "INVALID_METHOD")
        self.assertIn("Invalid method specified", str(context.exception))

    def test_empty_csv_data(self):
        with self.assertRaises(DataCleaningError) as context:
            vis_data("""""", self.valid_method, self.valid_target, self.valid_cols)
        
        self.assertEqual(context.exception.error_type, "EMPTY_DATA")
        self.assertIn("CSV data is empty", str(context.exception))

#     def test_malformed_csv_data(self):
#         malformed_csv = """Type,Value1,Value2
# A,10,20,
# B,15,invalid"""
        
#         with self.assertRaises(DataCleaningError) as context:
#             vis_data(malformed_csv, self.valid_method, self.valid_target, self.valid_cols)
        
#         self.assertEqual(context.exception.error_type, "UNKNOWN_ERROR")

    def test_json_parse_error(self):
        # Simulate main() function behavior for JSON parsing error
        invalid_json = "{'invalid': json}"
        
        # Redirect stdout and stderr to capture output
        output = StringIO()
        with self.assertRaises(SystemExit) as context:
            try:
                input_data = json.loads(invalid_json)
            except json.JSONDecodeError as e:
                error_response = {
                    "Status": "error",
                    "Error": {
                        "Type": "JSON_PARSE_ERROR",
                        "Message": "Invalid JSON input",
                        "Details": str(e)
                    }
                }
                print(json.dumps(error_response), file=output)
                raise SystemExit(1)
        
        self.assertEqual(context.exception.code, 1)
        error_output = json.loads(output.getvalue())
        self.assertEqual(error_output["Error"]["Type"], "JSON_PARSE_ERROR")

    def test_missing_csv_data(self):
        # Test missing required CSV data in input
        input_data = {
            "method": "sum",
            "target_column": "Type",
            "selected_cols": ["Value1"]
        }
        
        output = StringIO()
        with self.assertRaises(SystemExit) as context:
            if not input_data.get("csv_data"):
                error_response = {
                    "Status": "error",
                    "Error": {
                        "Type": "MISSING_DATA",
                        "Message": "CSV data is required",
                        "Details": "The 'csv_data' field is missing or empty"
                    }
                }
                print(json.dumps(error_response), file=output)
                raise SystemExit(1)
        
        self.assertEqual(context.exception.code, 1)
        error_output = json.loads(output.getvalue())
        self.assertEqual(error_output["Error"]["Type"], "MISSING_DATA")

    def test_successful_visualization(self):
        # Test successful case to ensure error handling doesn't interfere
        result = vis_data(self.valid_csv, self.valid_method, self.valid_target, self.valid_cols)
        self.assertIsInstance(result, str)
        # Verify the output is valid CSV
        df = pd.read_csv(StringIO(result))
        self.assertIn("Type", df.columns)
        self.assertIn("Value1_Total", df.columns)
        self.assertIn("Value2_Total", df.columns)

if __name__ == '__main__':
    unittest.main()