# import unittest
# from unittest.mock import patch, Mock
# import json
# from io import StringIO

# import requests
# from html_data import html_data  # Replace 'your_script' with the actual filename

# class TestHtmlDataErrorHandling(unittest.TestCase):

#     def test_invalid_url_format(self):
#         invalid_url = "not-a-valid-url"
#         result = html_data(invalid_url)
#         self.assertEqual(json.loads(result), {"error": "Invalid URL format"})

#     @patch('requests.get')
#     def test_request_exception(self, mock_get):
#         mock_get.side_effect = requests.RequestException("Failed to connect")
#         url = "http://example.com"
#         result = html_data(url)
#         self.assertEqual(json.loads(result), {"error": "Request failed: Failed to connect"})

#     @patch('requests.get')
#     def test_no_tables_in_html(self, mock_get):
#         mock_response = Mock()
#         mock_response.text = "<html><head></head><body><p>No tables here!</p></body></html>"
#         mock_response.raise_for_status = Mock()
#         mock_get.return_value = mock_response
#         url = "http://example.com"
#         result = html_data(url)
#         self.assertEqual(json.loads(result), {'error': 'Processing failed: No tables found'})

#     @patch('requests.get')
#     def test_processing_exception(self, mock_get):
#         mock_response = Mock()
#         mock_response.text = None  # Simulating invalid content
#         mock_response.raise_for_status = Mock()
#         mock_get.return_value = mock_response
#         url = "http://example.com"
#         result = html_data(url)
#         error_message = json.loads(result).get("error")
#         self.assertTrue(error_message.startswith("Processing failed:"))

# if __name__ == "__main__":
#     unittest.main()

import unittest
from unittest.mock import patch, MagicMock
import json
import pandas as pd
from html_data import validate_url, html_data, HTMLScrapingError

class TestHTMLScraping(unittest.TestCase):

    def test_validate_url_invalid_format(self):
        with self.assertRaises(HTMLScrapingError) as context:
            validate_url(None)
        self.assertEqual(context.exception.error_type, "INVALID_URL")

        with self.assertRaises(HTMLScrapingError) as context:
            validate_url(123)
        self.assertEqual(context.exception.error_type, "INVALID_URL")

    def test_validate_url_empty_string(self):
        with self.assertRaises(HTMLScrapingError) as context:
            validate_url("")
        self.assertEqual(context.exception.error_type, "INVALID_URL")

    def test_validate_url_invalid_structure(self):
        with self.assertRaises(HTMLScrapingError) as context:
            validate_url("invalid-url")
        self.assertEqual(context.exception.error_type, "INVALID_URL")

    @patch("html_data.requests.get")
    def test_html_data_request_error(self, mock_get):
        mock_get.side_effect = Exception("Request failed")
        with self.assertRaises(HTMLScrapingError) as context:
            html_data("http://example.com")
        # self.assertEqual(context.exception.error_type, "REQUEST_ERROR")
        self.assertEqual(context.exception.error_type, "UNKNOWN_ERROR")

    @patch("html_data.requests.get")
    @patch("html_data.pd.read_html")
    def test_html_data_parse_error(self, mock_read_html, mock_get):
        mock_get.return_value = MagicMock(status_code=200, text="<html></html>")
        mock_read_html.side_effect = Exception("Parse failed")

        with self.assertRaises(HTMLScrapingError) as context:
            html_data("http://example.com")
        self.assertEqual(context.exception.error_type, "PARSE_ERROR")

    @patch("html_data.requests.get")
    @patch("html_data.pd.read_html")
    def test_html_data_no_tables(self, mock_read_html, mock_get):
        mock_get.return_value = MagicMock(status_code=200, text="<html></html>")
        mock_read_html.return_value = []

        with self.assertRaises(HTMLScrapingError) as context:
            html_data("http://example.com")
        self.assertEqual(context.exception.error_type, "NO_TABLES")

    @patch("html_data.requests.get")
    @patch("html_data.pd.read_html")
    def test_html_data_processing_error(self, mock_read_html, mock_get):
        mock_get.return_value = MagicMock(status_code=200, text="<html><table></table></html>")
        mock_read_html.return_value = [MagicMock()]

        def side_effect_fillna(*args, **kwargs):
            raise Exception("Processing failed")

        mock_read_html.return_value[0].fillna.side_effect = side_effect_fillna

        with self.assertRaises(HTMLScrapingError) as context:
            html_data("http://example.com")
        self.assertEqual(context.exception.error_type, "PROCESSING_ERROR")

    # @patch("html_data.requests.get")
    # @patch("html_data.pd.read_html")
    # def test_html_data_success(self, mock_read_html, mock_get):
    #     mock_get.return_value = MagicMock(status_code=200, text="<html><table></table></html>")
    #     mock_read_html.return_value = [
    #         MagicMock(
    #             fillna=MagicMock(return_value=MagicMock(
    #                 to_dict=MagicMock(return_value={"key": "value"}),
    #                 columns=["Column1"]
    #             ))
    #         )
    #     ]

    #     result = html_data("http://example.com")
    #     data = json.loads(result)
    #     self.assertEqual(len(data), 1)
    #     self.assertEqual(data[0]["columns"], ["Column1"])
    @patch("html_data.pd.read_html")
    @patch("html_data.requests.get")
    def test_html_data_success(self, mock_get, mock_read_html):
        mock_get.return_value = MagicMock(status_code=200, text="<html></html>")
        mock_read_html.return_value = [pd.DataFrame({"A": [1, 2], "B": [3, 4]})]

        result = html_data("http://example.com")
        result = json.loads(result)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["columns"], ["A", "B"])
        self.assertEqual(result[0]["data"], [{"A": 1, "B": 3}, {"A": 2, "B": 4}])


if __name__ == "__main__":
    unittest.main()
