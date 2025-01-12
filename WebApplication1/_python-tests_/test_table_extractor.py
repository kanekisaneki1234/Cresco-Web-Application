import unittest
from unittest.mock import patch, mock_open
import base64
from io import BytesIO
import sys
from table_extractor import extract_tables_from_docx, DocHandlerError, main

class TestDocumentHandler(unittest.TestCase):
    def setUp(self):
        self.sample_base64 = base64.b64encode(b"test data").decode()

    @patch('sys.argv', ['script.py'])
    def test_missing_file_extension(self):
        with patch('sys.stdin', BytesIO(b'')):
            with self.assertRaises(SystemExit) as cm:
                main()
        self.assertEqual(cm.exception.code, 1)

    @patch('sys.argv', ['script.py', '.txt'])
    def test_unsupported_format(self):
        with patch('sys.stdin', BytesIO(self.sample_base64.encode())):
            with self.assertRaises(SystemExit) as cm:
                main()
        self.assertEqual(cm.exception.code, 1)

    @patch('sys.argv', ['script.py', '.pdf'])
    def test_empty_input(self):
        with patch('sys.stdin', BytesIO(b'')):
            with self.assertRaises(SystemExit) as cm:
                main()
        self.assertEqual(cm.exception.code, 1)

    @patch('sys.argv', ['script.py', '.pdf'])
    def test_invalid_base64(self):
        with patch('sys.stdin', BytesIO(b'invalid_base64!')):
            with self.assertRaises(SystemExit) as cm:
                main()
        self.assertEqual(cm.exception.code, 1)

    @patch('sys.argv', ['script.py', '.pdf'])
    @patch('pdfplumber.open')
    def test_pdf_no_tables(self, mock_pdf):
        mock_pdf.return_value.__enter__.return_value.pages = []
        with patch('sys.stdin', BytesIO(self.sample_base64.encode())):
            with self.assertRaises(SystemExit) as cm:
                main()
        self.assertEqual(cm.exception.code, 1)

    @patch('sys.argv', ['script.py', '.pdf'])
    @patch('pdfplumber.open')
    def test_pdf_processing_error(self, mock_pdf):
        mock_pdf.side_effect = Exception("PDF processing failed")
        with patch('sys.stdin', BytesIO(self.sample_base64.encode())):
            with self.assertRaises(SystemExit) as cm:
                main()
        self.assertEqual(cm.exception.code, 1)

    # @patch('sys.argv', ['script.py', '.docx'])
    # @patch('docx.Document')
    def test_no_tables_in_docx(self):
        # Mock an empty Word document
        mock_docx_bytes = BytesIO()
        
        with patch("table_extractor.Document") as MockDocument:
            # Mock the Document object to simulate a Word document with no tables
            mock_document_instance = MockDocument.return_value
            mock_document_instance.tables = []  # No tables

            with self.assertRaises(DocHandlerError) as context:
                extract_tables_from_docx(mock_docx_bytes.getvalue())

            # Check if the error message and type are correct
            self.assertEqual(context.exception.error_type, "NO_TABLES")

    @patch('sys.argv', ['script.py', '.docx'])
    @patch('docx.Document')
    def test_docx_processing_error(self, mock_docx):
        mock_docx.side_effect = Exception("DOCX processing failed")
        with patch('sys.stdin', BytesIO(self.sample_base64.encode())):
            with self.assertRaises(SystemExit) as cm:
                main()
        self.assertEqual(cm.exception.code, 1)

    def test_doc_handler_error_creation(self):
        error = DocHandlerError("Test message", "TEST_ERROR", "Test details")
        self.assertEqual(str(error), "Test message")
        self.assertEqual(error.error_type, "TEST_ERROR")
        self.assertEqual(error.details, "Test details")

if __name__ == '__main__':
    unittest.main()