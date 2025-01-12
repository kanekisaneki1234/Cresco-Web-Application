import pandas as pd
import sys
import io
import json

class DataCleaningError(Exception):
    def __init__(self, message, error_type=None, details=None):
        super().__init__(message)
        self.error_type = error_type
        self.details = details

def safe_typecast(data: pd.DataFrame, target_type: type, column: str, errors: str = 'coerce') -> pd.DataFrame:
    try:
        result = data.copy()
        
        if target_type == bool:
            result[column] = result[column].map(lambda x: str(x).lower() in ['true', '1', 'yes', 'y'] if pd.notna(x) else None)
        else:
            result[column] = pd.to_numeric(result[column], errors=errors) if target_type in (int, float) else result[column].astype(str)
            
            if target_type == int and errors == 'coerce':
                result[column] = result[column].where(result[column].notna() & (result[column] % 1 == 0), pd.NA)
                
        return result
        
    except Exception as e:
        raise DataCleaningError(
            message=f"Failed to typecast column '{column}'",
            error_type="TYPECAST_ERROR",
            details=str(e)
        )

def validate_csv_data(csv_data):
    """Validate CSV data before processing"""
    if not csv_data or not isinstance(csv_data, str):
        raise DataCleaningError(
            message="Invalid CSV data format",
            error_type="INVALID_CSV",
            details="CSV data must be a non-empty string"
        )
    try:
        df = pd.read_csv(io.StringIO(csv_data))
        if df.empty:
            raise DataCleaningError(
                message="Empty CSV data",
                error_type="INVALID_CSV",
                details="CSV data contains no rows"
            )
    except Exception as e:
        raise DataCleaningError(
            message="Failed to parse CSV data",
            error_type="PARSE_ERROR",
            details=str(e)
        )

def clean_csv(input_data, method="dropna", column=None, value=None, target_type="str", limit=None):
    try:
        validate_csv_data(input_data)
        data = pd.read_csv(io.StringIO(input_data))

        if column and column not in data.columns:
            raise DataCleaningError(
                message=f"Column '{column}' not found in dataset",
                error_type="INVALID_COLUMN",
                details=f"Available columns: {', '.join(data.columns)}"
            )
        
        if method == "typecast":
            if not target_type:
                raise DataCleaningError(
                    message="Target type must be specified for typecast method",
                    error_type="MISSING_TYPE"
                )
            if not column:
                raise DataCleaningError(
                    message="Column name must be specified for typecast method",
                    error_type="MISSING_COLUMN"
                )
                
            type_map = {
                "int": int,
                "float": float,
                "str": str,
                "bool": bool
            }
            
            if target_type not in type_map:
                raise DataCleaningError(
                    message=f"Unsupported type: {target_type}",
                    error_type="INVALID_TYPE",
                    details=f"Supported types: {', '.join(type_map.keys())}"
                )
                
            cleaned_data = safe_typecast(
                data,
                type_map[target_type],
                column=column,
                errors='coerce'
            )

        elif method == "dropna":
            if column:
                cleaned_data = data.dropna(subset=[column])
            else:
                cleaned_data = data.dropna()
        elif method == "fillna":
            if value is None:
                raise DataCleaningError(
                    message="Value must be provided for 'fillna' method",
                    error_type="MISSING_VALUE"
                )
            try:
                if column:
                    cleaned_data = data.copy()
                    cleaned_data[column] = data[column].fillna(value)
                else:
                    cleaned_data = data.fillna(value)
            except ValueError as e:
                raise DataCleaningError(
                    message="Invalid fill value for the data type",
                    error_type="INVALID_VALUE",
                    details=str(e)
                )
        elif method == "ffill":
            try:
                if limit:
                    limit = int(limit)
                    if column:
                        cleaned_data = data.copy()
                        cleaned_data[column] = data[column].ffill(limit=limit if limit > 0 else None)
                    else:
                        cleaned_data = data.ffill(limit=limit if limit > 0 else None)
                else:
                    if column:
                        cleaned_data = data.copy()
                        cleaned_data[column] = data[column].ffill()
                    else:
                        cleaned_data = data.ffill()
            except ValueError as e:
                raise DataCleaningError(
                    message="Invalid limit value",
                    error_type="INVALID_VALUE",
                    details=str(e)
                )
            
        elif method == "bfill":
            try:
                if limit:
                    limit = int(limit)
                    if column:
                        cleaned_data = data.copy()
                        cleaned_data[column] = data[column].bfill(limit=limit if limit > 0 else None)
                    else:
                        cleaned_data = data.bfill(limit=limit if limit > 0 else None)
                else:
                    if column:
                        cleaned_data = data.copy()
                        cleaned_data[column] = data[column].bfill()
                    else:
                        cleaned_data = data.bfill()
            except ValueError as e:
                raise DataCleaningError(
                    message="Invalid limit value",
                    error_type="INVALID_VALUE",
                    details=str(e)
                )

        elif method == "fillna_mean":
            if column:
                try:
                    mean_value = data[column].mean()
                    cleaned_data = data.copy()
                    cleaned_data[column] = data[column].fillna(mean_value)
                except TypeError as e:
                    raise DataCleaningError(
                        message=f"Cannot calculate 'mean' for non-numeric column '{column}'",
                        error_type="INVALID_OPERATION",
                        details=f"Column data type: {data[column].dtype}"
                    )
            else:
                try:
                    cleaned_data = data.fillna(data.mean())
                except TypeError as e:
                    raise DataCleaningError(
                        message="Cannot calculate 'mean' for non-numeric dataset",
                        error_type="INVALID_OPERATION",
                        details="The dataset contains non-numeric columns"
                    )
            
        elif method == "fillna_median":
            if column:
                try:
                    median_value = data[column].median()
                    cleaned_data = data.copy()
                    cleaned_data[column] = data[column].fillna(median_value)
                except TypeError as e:
                    raise DataCleaningError(
                        message=f"Cannot calculate 'median' for non-numeric column '{column}'",
                        error_type="INVALID_OPERATION",
                        details=f"Column data type: {data[column].dtype}"
                    )
            else:
                try:
                    cleaned_data = data.fillna(data.median())
                except TypeError as e:
                    raise DataCleaningError(
                        message="Cannot calculate 'median' for non-numeric dataset",
                        error_type="INVALID_OPERATION",
                        details="The dataset contains non-numeric columns"
                    )

        elif method == "fillna_mode":
            try:
                if column:
                    if data[column].notna().sum() == 0:
                        raise DataCleaningError(
                            message=f"Cannot calculate mode for column '{column}' because it contains only NaN values",
                            error_type="EMPTY_COLUMN",
                            details="The column has no valid values to compute a mode"
                        )
                    
                    mode_value = data[column].mode()
                    if len(mode_value) == 0:
                        raise DataCleaningError(
                            message=f"Cannot calculate mode for column '{column}'",
                            error_type="EMPTY_COLUMN",
                            details="No mode found for the column"
                        )
                        
                    cleaned_data = data.copy()
                    cleaned_data[column] = data[column].fillna(mode_value[0])
                else:
                    if data.notna().sum().sum() == 0:
                        raise DataCleaningError(
                            message="Cannot calculate mode for the dataset because all columns contain only NaN values",
                            error_type="EMPTY_DATASET",
                            details="The dataset has no valid values to compute mode values"
                        )
                    
                    mode_values = data.mode().iloc[0]
                    cleaned_data = data.fillna(mode_values)
                    
            except Exception as e:
                raise DataCleaningError(
                    message=f"Error calculating mode: {str(e)}",
                    error_type="EMPTY_COLUMN",
                    details="Error occurred while computing mode"
                )

        elif method == "replace":
            if not isinstance(value, dict) or 'oldVal' not in value or 'newVal' not in value:
                raise DataCleaningError(
                    message="Invalid replacement values",
                    error_type="INVALID_VALUE",
                    details="Both 'oldVal' and 'newVal' values must be provided for replace method"
                )
                
            if target_type not in ['exact', 'contains']:
                raise DataCleaningError(
                    message="Invalid target_type for replace method",
                    error_type="INVALID_TYPE",
                    details="target_type must be either 'exact' or 'contains'"
                )
                
            try:
                old_value = value['oldVal'].strip()
                new_value = value['newVal'].strip()

                if (old_value == "" or new_value == ""):
                    raise DataCleaningError(
                        message="Please provide both the 'old value' and 'new value' for the replacement operation",
                        error_type="REPLACE_ERROR"
                    )
                
                try:
                    old_value = float(old_value) if '.' in str(old_value) else int(old_value)
                except (ValueError, TypeError):
                    pass
                    
                try:
                    new_value = float(new_value) if '.' in str(new_value) else int(new_value)
                except (ValueError, TypeError):
                    pass
                
                cleaned_data = data.copy()
                if target_type == "exact":
                    if column:
                        cleaned_data[column] = cleaned_data[column].replace(old_value, new_value)
                    else:
                        cleaned_data = cleaned_data.replace(old_value, new_value)
                else: 
                    if column:
                        cleaned_data[column] = cleaned_data[column].replace(
                            to_replace=f".*{old_value}.*", value=new_value, regex=True
                        )
                    else:
                        cleaned_data = cleaned_data.replace(
                            to_replace=f".*{old_value}.*", value=new_value, regex=True
                        )
                    
            except Exception as e:
                raise DataCleaningError(
                    message="Error during value replacement",
                    error_type="REPLACE_ERROR",
                    details=str(e)
                )
        else:
            raise DataCleaningError(
                message=f"Unsupported cleaning method: {method}",
                error_type="INVALID_METHOD"
            )

        output = io.StringIO()
        cleaned_data.to_csv(output, index=False)
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
        if not input_json.strip():
            raise DataCleaningError(
                message="Empty input",
                error_type="JSON_PARSE_ERROR",
                details="No input provided"
            )
            
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
                error_type="MISSING_DATA"
            )

        method = input_data.get("method", "dropna")
        column = input_data.get("column")
        value = input_data.get("value")
        target_type = input_data.get("target_type")
        limit = input_data.get("limit")

        cleaned_csv = clean_csv(csv_data, method=method, column=column, value=value, target_type=target_type, limit=limit)
        
        response = {
            "Status": "success",
            "Data": cleaned_csv
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