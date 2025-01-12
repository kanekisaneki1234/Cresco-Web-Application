import sys
import base64
import io
import pandas as pd
import pdfplumber
from docx import Document
import json

class DocHandlerError(Exception):
    def __init__(self, message, error_type=None, details=None):
        super().__init__(message)
        self.error_type = error_type
        self.details = details

def make_columns_unique(columns):
    seen = {}
    unique_columns = []
    for item in columns:
        if item in seen:
            seen[item] += 1
            unique_columns.append(f"{item}_{seen[item]}")
        else:
            seen[item] = 0
            unique_columns.append(item)
    return unique_columns

def pdf_tables_to_list(file_bytes):
    try:
        tables = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_tables = page.extract_tables()
                for table in page_tables:
                    if table and len(table) > 0:
                        headers = make_columns_unique(table[0])
                        df = pd.DataFrame(table[1:], columns=headers)
                        tables.append(df)
        if not tables:
            raise DocHandlerError(
                message="No tables found in PDF",
                error_type="NO_TABLES",
                details="The PDF document does not contain any tables"
            )
        return tables
    except Exception as e:
        if isinstance(e, DocHandlerError):
            raise
        raise DocHandlerError(
            message="Failed to process PDF",
            error_type="PDF_PROCESSING_ERROR",
            details=str(e)
        )

def extract_tables_from_docx(file_bytes):
    try:
        tables = []
        doc = Document(io.BytesIO(file_bytes))
        for table in doc.tables:
            data = [[cell.text.strip() for cell in row.cells] for row in table.rows]
            if data and len(data) > 0:
                headers = make_columns_unique(data[0])
                df = pd.DataFrame(data[1:], columns=headers)
                tables.append(df)
        if (not tables or len(tables)==0):
            raise DocHandlerError(
                message="No tables found in document",
                error_type="NO_TABLES",
                details="The Word document does not contain any tables"
            )
        return tables
    except Exception as e:
        if isinstance(e, DocHandlerError):
            raise
        raise DocHandlerError(
            message="Failed to process Word document",
            error_type="DOCX_PROCESSING_ERROR",
            details=str(e)
        )

def main():
    try:
        if len(sys.argv) != 2:
            raise DocHandlerError(
                message="Invalid usage",
                error_type="INVALID_ARGS",
                details="Usage: script.py <file_extension>"
            )

        file_extension = sys.argv[1].lower()
        base64_data = sys.stdin.read().strip()

        if not base64_data:
            raise DocHandlerError(
                message="No data provided",
                error_type="MISSING_DATA",
                details="Input data is required"
            )

        try:
            file_bytes = base64.b64decode(base64_data)
        except Exception as e:
            raise DocHandlerError(
                message="Invalid base64 data",
                error_type="DECODE_ERROR",
                details=str(e)
            )

        if file_extension == '.pdf':
            tables = pdf_tables_to_list(file_bytes)
        elif file_extension in ('.doc', '.docx'):
            tables = extract_tables_from_docx(file_bytes)
        else:
            raise DocHandlerError(
                message="Unsupported file format",
                error_type="INVALID_FORMAT",
                details=f"File extension {file_extension} is not supported"
            )

        tables_json = []
        for i, df in enumerate(tables):
            tables_json.append({
                "table_index": i,
                "data": df.to_dict(orient='records'),
                "columns": df.columns.tolist()
            })
        print(json.dumps(tables_json))

    except DocHandlerError as e:
        error_response = {
            "Status": "error",
            "Error": {
                "Type": e.error_type,
                "Message": str(e),
                "Details": e.details
            }
        }
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()