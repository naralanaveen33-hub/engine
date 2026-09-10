"""
Dataset inspection and validation script for AquaCrop Step 1.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "crop_recommendation.csv"

def inspect_dataset():
    if not DATA_PATH.exists():
        print("Dataset missing:", DATA_PATH)
        return False

    df = pd.read_csv(DATA_PATH)
    print("=== DATASET VALIDATION REPORT ===")
    print(f"File Path: {DATA_PATH}")
    print(f"File Size: {DATA_PATH.stat().st_size} bytes")
    print(f"Total Rows: {len(df)}")
    print(f"Total Columns: {len(df.columns)}")
    print(f"Columns: {list(df.columns)}")
    
    # Check data types
    print("\n--- Data Types ---")
    for col, dtype in df.dtypes.items():
        print(f"  {col}: {dtype}")
        
    # Check nulls/missing values
    print("\n--- Missing Values ---")
    null_counts = df.isnull().sum()
    total_nulls = null_counts.sum()
    print(f"Total Missing Cells: {total_nulls}")
    for col, count in null_counts.items():
        if count > 0:
            print(f"  {col}: {count} missing ({count / len(df) * 100:.2f}%)")
            
    # Check duplicates
    duplicate_rows = df.duplicated().sum()
    print(f"\nDuplicate Rows: {duplicate_rows} ({duplicate_rows / len(df) * 100:.2f}%)")
    
    # Target column check
    target_col = "label" if "label" in df.columns else "crop"
    print(f"\nTarget Column: {target_col}")
    class_counts = df[target_col].value_counts()
    print(f"Number of Target Classes: {len(class_counts)}")
    print("Target Class Distribution:")
    for crop_name, count in class_counts.items():
        print(f"  {crop_name}: {count} rows")
        
    # Numeric feature range inspection
    feature_cols = [c for c in df.columns if c != target_col]
    print("\n--- Feature Summary Statistics ---")
    stats = df[feature_cols].describe().T[['mean', 'std', 'min', '25%', '50%', '75%', 'max']]
    print(stats.to_string())
    
    # Constant column check
    constant_cols = [c for c in feature_cols if df[c].nunique() <= 1]
    print(f"\nConstant Columns: {constant_cols if constant_cols else 'None'}")
    
    report = {
        "rows": len(df),
        "columns": list(df.columns),
        "target": target_col,
        "classes_count": len(class_counts),
        "classes": sorted(list(class_counts.index)),
        "null_count": int(total_nulls),
        "duplicate_count": int(duplicate_rows),
        "feature_summary": stats.to_dict()
    }
    
    return report

if __name__ == "__main__":
    inspect_dataset()
