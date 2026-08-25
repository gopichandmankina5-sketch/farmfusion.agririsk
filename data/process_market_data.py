import pandas as pd
import os

def process_market_data():
    input_file = r"C:\Users\gopic\Downloads\AgriRisk\ml\9ef84268-d588-465a-a308-a864a43d0070 (1).csv"
    output_file = r"C:\Users\gopic\Downloads\AgriRisk\data\processed\real_market.csv"
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return
        
    df = pd.read_csv(input_file)
    
    # Clean column names
    df.columns = [c.replace('_x0020_', '_').strip() for c in df.columns]
    
    # Parse date
    df['Arrival_Date'] = pd.to_datetime(df['Arrival_Date'], format="%d/%m/%Y", errors='coerce')
    df = df.dropna(subset=['Arrival_Date'])
    
    # Sort chronologically
    df = df.sort_values(by=['State', 'District', 'Market', 'Commodity', 'Arrival_Date'])
    
    # We want to predict Modal_Price. To prevent data leakage, all features must be computed 
    # from data prior to the target date for a given market and commodity.
    
    group_cols = ['State', 'District', 'Market', 'Commodity']
    
    # Ensure no duplicates per date per group (take mean if multiple exist)
    df = df.groupby(group_cols + ['Arrival_Date']).agg({
        'Min_Price': 'mean',
        'Max_Price': 'mean',
        'Modal_Price': 'mean'
    }).reset_index()
    
    # Re-sort just to be safe
    df = df.sort_values(by=group_cols + ['Arrival_Date'])
    
    # Shift the modal price to get previous day's price (T-1)
    df['prev_price'] = df.groupby(group_cols)['Modal_Price'].shift(1)
    
    # Price change between T-1 and T-2
    df['prev_price_2'] = df.groupby(group_cols)['Modal_Price'].shift(2)
    df['price_change'] = df['prev_price'] - df['prev_price_2']
    
    # Rolling features over the past records (using shifted price to avoid leakage)
    # 7-day rolling mean
    df['rolling_7d_mean'] = df.groupby(group_cols)['prev_price'].transform(lambda x: x.rolling(7, min_periods=1).mean())
    
    # 30-day rolling mean
    df['rolling_30d_mean'] = df.groupby(group_cols)['prev_price'].transform(lambda x: x.rolling(30, min_periods=1).mean())
    
    # Rolling volatility (std dev over 7 days)
    df['volatility_7d'] = df.groupby(group_cols)['prev_price'].transform(lambda x: x.rolling(7, min_periods=2).std())
    df['volatility_7d'] = df['volatility_7d'].fillna(0) # Handle NaN for single/two records
    
    # Drop rows where we don't have a previous price at all (can't use them for testing if we depend on historical data)
    df = df.dropna(subset=['prev_price'])
    
    # Drop the temporary prev_price_2
    df = df.drop(columns=['prev_price_2'])
    
    # Sort purely by date for chronological split later
    df = df.sort_values('Arrival_Date')
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    df.to_csv(output_file, index=False)
    print(f"Processed Market Data: {len(df)} records saved to {output_file}")

if __name__ == "__main__":
    process_market_data()
