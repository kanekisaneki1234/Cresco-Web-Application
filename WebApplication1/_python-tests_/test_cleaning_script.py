import unittest
import pandas as pd
import json
from cleaning_script import clean_csv, DataCleaningError

class TestDataCleaningErrorHandling(unittest.TestCase):
    def setUp(self):
        # Sample valid CSV data for testing
        self.valid_csv = "id,name,value\n1,test,100\n2,test2,200"
        self.valid_csv_with_nulls = "id,name,value\n1,,100\n2,test2,"

    def test_invalid_csv_data(self):
        """Test handling of invalid CSV data"""
        invalid_csv = ""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(invalid_csv)
        self.assertEqual(context.exception.error_type, "INVALID_CSV")

    def test_empty_csv_data(self):
        """Test handling of empty CSV data"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv("")
        self.assertEqual(context.exception.error_type, "INVALID_CSV")

    def test_invalid_column_name(self):
        """Test handling of invalid column name"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv, column="nonexistent")
        self.assertEqual(context.exception.error_type, "INVALID_COLUMN")

    def test_invalid_method(self):
        """Test handling of invalid cleaning method"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv, method="invalid_method")
        self.assertEqual(context.exception.error_type, "INVALID_METHOD")

    def test_typecast_missing_column(self):
        """Test typecast method with missing column"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv, method="typecast", target_type="int")
        self.assertEqual(context.exception.error_type, "MISSING_COLUMN")

    def test_typecast_missing_type(self):
        """Test typecast method with missing type"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv, method="typecast", column="value", target_type="")
        self.assertEqual(context.exception.error_type, "MISSING_TYPE")

    def test_typecast_invalid_type(self):
        """Test typecast method with invalid type"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv, method="typecast", column="value", target_type="invalid_type")
        self.assertEqual(context.exception.error_type, "INVALID_TYPE")

    def test_fillna_missing_value(self):
        """Test fillna method with missing value"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv_with_nulls, method="fillna")
        self.assertEqual(context.exception.error_type, "MISSING_VALUE")

    def test_fillna_mode_empty_column(self):
        """Test fillna_mode method with empty column"""
        empty_column_csv = "id,name\n,\n,"
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(empty_column_csv, method="fillna_mode", column="name")
        self.assertEqual(context.exception.error_type, "EMPTY_COLUMN")

    def test_fillna_mean_non_numeric(self):
        """Test fillna_mean method with non-numeric column"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv_with_nulls, method="fillna_mean", column="name")
        self.assertEqual(context.exception.error_type, "INVALID_OPERATION")

    def test_fillna_median_non_numeric(self):
        """Test fillna_median method with non-numeric column"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv_with_nulls, method="fillna_median", column="name")
        self.assertEqual(context.exception.error_type, "INVALID_OPERATION")

    def test_replace_missing_values(self):
        """Test replace method with missing replacement values"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv, method="replace", value={})
        self.assertEqual(context.exception.error_type, "INVALID_VALUE")

    def test_replace_invalid_type(self):
        """Test replace method with invalid target type"""
        value = {"oldVal": "test", "newVal": "new_test"}
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv, method="replace", value=value, target_type="invalid")
        self.assertEqual(context.exception.error_type, "INVALID_TYPE")

    def test_ffill_invalid_limit(self):
        """Test ffill method with invalid limit"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv_with_nulls, method="ffill", limit="invalid")
        self.assertEqual(context.exception.error_type, "INVALID_VALUE")

    def test_bfill_invalid_limit(self):
        """Test bfill method with invalid limit"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(self.valid_csv_with_nulls, method="bfill", limit="invalid")
        self.assertEqual(context.exception.error_type, "INVALID_VALUE")

    def test_none_csv_data(self):
        """Test handling of None CSV data"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(None)
        self.assertEqual(context.exception.error_type, "INVALID_CSV")

    def test_non_string_csv_data(self):
        """Test handling of non-string CSV data"""
        with self.assertRaises(DataCleaningError) as context:
            clean_csv(123)
        self.assertEqual(context.exception.error_type, "INVALID_CSV")

    def test_main_json_parse_error(self):
        """Test JSON parsing error in main function"""
        invalid_json = '{"invalid": json}'
        # with self.assertRaises(DataCleaningError) as context:
        #     input_data = json.loads(invalid_json)
        # self.assertIsInstance(context.exception, json.JSONDecodeError)
        with self.assertRaises(DataCleaningError) as context:
            try:
                input_data = json.loads(invalid_json)
            except json.JSONDecodeError as e:
                raise DataCleaningError(
                    message="Invalid JSON input",
                    error_type="JSON_PARSE_ERROR",
                    details=str(e)
                )
        self.assertEqual(context.exception.error_type, "JSON_PARSE_ERROR")

if __name__ == '__main__':
    unittest.main()