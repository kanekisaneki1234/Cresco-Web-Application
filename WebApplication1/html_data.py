import pandas as pd
import requests
import sys
import json
from urllib.parse import urlparse

class HTMLScrapingError(Exception):
    def __init__(self, message, error_type=None, details=None):
        super().__init__(message)
        self.error_type = error_type
        self.details = details

def validate_url(url):
    if not url or not isinstance(url, str):
        raise HTMLScrapingError(
            message="Invalid URL format",
            error_type="INVALID_URL",
            details="URL must be a non-empty string"
        )
    
    url = url.strip().strip('"\'')
    if url == "":
        raise HTMLScrapingError(
            message="Empty URL",
            error_type="INVALID_URL",
            details="URL cannot be empty"
        )
        
    result = urlparse(url)
    if not all([result.scheme, result.netloc]):
        raise HTMLScrapingError(
            message="Invalid URL structure",
            error_type="INVALID_URL",
            details="URL must include scheme (e.g., http://) and domain"
        )
    
    return url

def html_data(url):
    try:
        url = validate_url(url)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            raise HTMLScrapingError(
                message="Failed to fetch URL",
                error_type="REQUEST_ERROR",
                details=str(e)
            )
            
        try:
            tables = pd.read_html(response.text)
        except Exception as e:
            raise HTMLScrapingError(
                message="Failed to parse HTML tables",
                error_type="PARSE_ERROR",
                details=str(e)
            )
            
        if not tables:
            raise HTMLScrapingError(
                message="No tables found in the HTML content",
                error_type="NO_TABLES",
                details="The webpage does not contain any HTML tables"
            )
            
        processed_tables = []
        for i, df in enumerate(tables):
            try:
                df = df.fillna("NA")
                processed_tables.append({
                    "table_index": i,
                    "data": df.to_dict(orient='records'),
                    "columns": df.columns.tolist()
                })
            except Exception as e:
                raise HTMLScrapingError(
                    message=f"Failed to process table {i}",
                    error_type="PROCESSING_ERROR",
                    details=str(e)
                )
                
        return json.dumps(processed_tables)
        
    except HTMLScrapingError:
        raise
    except Exception as e:
        raise HTMLScrapingError(
            message="An unexpected error occurred",
            error_type="UNKNOWN_ERROR",
            details=str(e)
        )

if __name__ == "__main__":
    try:
        # url = sys.stdin.readline().strip()
        url = sys.stdin.readline().strip().strip('"\'')
        if not url:
            raise HTMLScrapingError(
                message="No URL provided",
                error_type="MISSING_URL",
                details="Input URL is required"
            )
            
        processed_data = html_data(url)
        
        print(processed_data, end='')
        sys.exit(0)
        
    except HTMLScrapingError as e:
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