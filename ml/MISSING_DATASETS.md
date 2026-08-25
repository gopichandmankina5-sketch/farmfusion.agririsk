# Missing Datasets Report for AgriRisk ML Models

To fully transition the AgriRisk architecture from rule-based fallbacks to completely ML-driven predictions without relying on synthetic data or fabricated labels, the following real-world datasets are strictly required. 

---

## 1. Market ML Model

*   **Dataset Name**: Agricultural Commodity Prices (Historical)
*   **Recommended Real Source**: Agmarknet (Govt. of India) or similar official agricultural market portals.
*   **Required Columns**:
    *   `crop/commodity`
    *   `state`
    *   `district`
    *   `market`
    *   `date`
    *   `min_price`
    *   `max_price`
    *   `modal_price`
    *   `price change`
    *   `rolling averages`
    *   `price volatility`
*   **Geographic Level**: District or Specific Market level.
*   **Date Requirements**: Multi-year historical daily or weekly data to capture seasonality and market trends. **Must use chronological train/validation/test splitting.**
*   **Target Variable**: Next period `modal_price` or a computed `price_volatility` index representing market risk.
*   **Expected ML Problem**: Time-Series Forecasting / Regression.
*   **Current Availability**: The previously provided market-price CSV (requires processing to match the exact schema).
*   **What is Missing**: Integration of this historical data into the training pipeline and feature engineering (calculating rolling averages/volatility).

---

## 2. Weather ML Model

*   **Dataset Name**: Historical Daily Weather Data
*   **Recommended Real Source**: Open-Meteo Historical API, IMD (Indian Meteorological Department), or NOAA.
*   **Required Columns**:
    *   `date`
    *   `latitude` / `longitude` (or strict `district` mapping)
    *   `max_temperature`
    *   `min_temperature`
    *   `daily_rainfall`
    *   `humidity`
    *   `wind_speed`
    *   `extreme_weather_flag` (e.g., floods, droughts, heatwaves)
*   **Geographic Level**: High-resolution coordinates (Lat/Lon) or District-level at minimum.
*   **Date Requirements**: 10-20 years of historical daily data to learn extreme weather patterns and frequency.
*   **Target Variable**: Probability/occurrence of extreme weather events (e.g., severe drought or flooding) within a forecasting window.
*   **Expected ML Problem**: Classification (Extreme vs. Normal) or Time-Series Regression.
*   **Current Availability**: None. Currently relying solely on the live OpenWeatherMap API for real-time snapshots.
*   **What is Missing**: The historical dataset is entirely missing. Current weather from the API cannot be used to train historical risk models without a retrospective baseline.

---

## 3. Pest & Disease ML Model

*   **Dataset Name**: Crop Pest and Disease Occurrences
*   **Recommended Real Source**: Agricultural university surveys, ICAR datasets, or PlantVillage incidence logs.
*   **Required Columns**:
    *   `date`
    *   `state`
    *   `district`
    *   `crop`
    *   `pest_type`
    *   `disease_type`
    *   `incidence_severity` (e.g., low, medium, high / percentage crop affected)
    *   `historical_weather_context` (Temp/Humidity during the outbreak)
*   **Geographic Level**: District-level.
*   **Date Requirements**: Multi-year historical logs matching outbreak timelines.
*   **Target Variable**: `incidence_severity` or binary occurrence (Outbreak: Yes/No).
*   **Expected ML Problem**: Classification (predicting if an outbreak will occur) or Regression (predicting severity %).
*   **Current Availability**: None.
*   **What is Missing**: An authentic dataset of real pest outbreaks. Without this, the model cannot map agronomic and weather conditions to actual pest risks without fabricating fake target labels.
