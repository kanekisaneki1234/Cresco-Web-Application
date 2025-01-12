import pandas as pd
import sys
import io
import json

class DataCleaningError(Exception):
    def __init__(self, message, error_type=None, details=None):
        super().__init__(message)
        self.error_type = error_type
        self.details = details

def csv_info(input_data):
    try:
        try:
            data = pd.read_csv(io.StringIO(input_data))
        except Exception as e:
            raise DataCleaningError(
                message="Failed to parse CSV data",
                error_type="PARSE_ERROR",
                details=str(e)
            )
        info_csv = data.describe(include='all')
        dtype_counts = data.apply(lambda col: col.map(lambda x: str(type(x))).value_counts(sort=False))

        dtype_counts = dtype_counts.fillna(0).astype('int64')

        df_info = pd.concat([info_csv, dtype_counts], axis=0)
        
        null_counts = data.isnull().sum()

        null_counts = pd.DataFrame(null_counts).T

        null_counts.index = ['null value count']

        df_info = pd.concat([df_info, null_counts], axis=0)

        df_info = df_info.fillna("NA/0")

        output = io.StringIO()
        df_info.to_csv(output, index=True)
        return output.getvalue()

    except DataCleaningError:
        raise
    except Exception as e:
        raise DataCleaningError(
            message="An unexpected error occurred",
            error_type="UNKNOWN_ERROR",
            details=str(e)
        )



if __name__ == "__main__":
    try:
        input_json = sys.stdin.read()
        try:
            input_data = json.loads(input_json)
        except json.JSONDecodeError:
            raise DataCleaningError(
                message="Invalid JSON input",
                error_type="JSON_PARSE_ERROR"
            )

        csv_data = input_data.get("csv_data")
        if not csv_data:
            raise DataCleaningError(
                message="CSV data is required",
                error_type="MISSING_DATA"
            )
        
        data_info = csv_info(csv_data)
        
        response = {
            "Status": "success",
            "Data": data_info
        }
        print(json.dumps(response), file=sys.stdout)
        
    except DataCleaningError as e:
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