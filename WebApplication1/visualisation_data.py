import pandas as pd
import sys
import io
import json

class DataCleaningError(Exception):
    def __init__(self, message, error_type=None, details=None):
        super().__init__(message)
        self.error_type = error_type
        self.details = str(details) if details is not None else None

def vis_data(csv_data, method, target_column, selected_cols):
    try:
        data = pd.read_csv(io.StringIO(csv_data))
        
        if target_column not in data.columns:
            raise DataCleaningError(
                message=f"Target column '{target_column}' not found in data",
                error_type="INVALID_COLUMN",
                details=f"Available columns: {', '.join(data.columns)}"
            )
            
        for col in selected_cols:
            if col not in data.columns:
                raise DataCleaningError(
                    message=f"Selected column '{col}' not found in data",
                    error_type="INVALID_COLUMN",
                    details=f"Available columns: {', '.join(data.columns)}"
                )
            if not pd.api.types.is_numeric_dtype(data[col]):
                raise DataCleaningError(
                    message=f"Column '{col}' must be numeric",
                    error_type="INVALID_DATA_TYPE",
                    details=f"Current type: {data[col].dtype}"
                )

        type_counts = data[target_column].value_counts().reset_index()
        type_counts.columns = [target_column, 'Counts']
        
        if method == "sum":
            grouped = data.groupby(target_column)[selected_cols].sum()
            grouped = grouped.rename(columns={col: f"{col}_Total" for col in grouped.columns})
        elif method == "mean":
            grouped = data.groupby(target_column)[selected_cols].mean()
            grouped = grouped.rename(columns={col: f"{col}_Mean" for col in grouped.columns})
        elif method == "both":
            grouped_sum = data.groupby(target_column)[selected_cols].sum()
            grouped_mean = data.groupby(target_column)[selected_cols].mean()
            grouped_sum = grouped_sum.rename(columns={col: f"{col}_Total" for col in grouped_sum.columns})
            grouped_mean = grouped_mean.rename(columns={col: f"{col}_Mean" for col in grouped_mean.columns})
            grouped = pd.concat([grouped_sum, grouped_mean], axis=1)
        else:
            raise DataCleaningError(
                message="Invalid method specified",
                error_type="INVALID_METHOD",
                details=f"Supported methods: sum, mean, both. Received: {method}"
            )

        result = type_counts.merge(grouped.reset_index(), on=target_column)
        return result.to_csv(index=False)

    except DataCleaningError:
        raise
    except pd.errors.EmptyDataError:
        raise DataCleaningError(
            message="The input CSV data is empty",
            error_type="EMPTY_DATA",
            details="Please provide non-empty CSV data"
        )
    except Exception as e:
        raise DataCleaningError(
            message="An unexpected error occurred during data visualization",
            error_type="UNKNOWN_ERROR",
            details=str(e)
        )

if __name__ == "__main__":
    try:
        input_json = sys.stdin.read()
        try:
            input_data = json.loads(input_json)
        except json.JSONDecodeError as e:
            raise DataCleaningError(
                message="Invalid JSON input",
                error_type="JSON_PARSE_ERROR",
                details=str(e)
            )

        csv_data = input_data.get("csv_data")
        if not csv_data:
            raise DataCleaningError(
                message="CSV data is required",
                error_type="MISSING_DATA",
                details="The 'csv_data' field is missing or empty"
            )

        method = input_data.get("method")
        target_column = input_data.get("target_column")
        selected_cols = input_data.get("selected_cols", [])

        visualization_data = vis_data(csv_data, method, target_column, selected_cols)
        response = {
            "Status": "success",
            "Data": visualization_data
        }
        print(json.dumps(response))
        sys.exit(0)

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
    except Exception as e:
        error_response = {
            "Status": "error",
            "Error": {
                "Type": "SYSTEM_ERROR",
                "Message": "An unexpected error occurred",
                "Details": str(e)
            }
        }
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)