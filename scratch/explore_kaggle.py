import kagglehub
import pandas as pd
import os

def explore_dataset(name):
    path = kagglehub.dataset_download(name)
    print(f"--- Dataset: {name} ---")
    print("Files:", os.listdir(path))
    for file in os.listdir(path):
        if file.endswith('.csv'):
            df = pd.read_csv(os.path.join(path, file))
            print(f"\nFile: {file}")
            print(df.head(2))
            print("Columns:", df.columns.tolist())
    print("\n")

explore_dataset("akshatgupta7/crop-yield-in-indian-states-dataset")
explore_dataset("shankarpriya2913/crop-and-soil-dataset")
