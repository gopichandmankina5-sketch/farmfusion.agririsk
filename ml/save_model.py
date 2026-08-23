"""
AgriRisk – Model Save / Load Utilities
========================================
save_risk_model()  – Serialise the fitted Pipeline + metadata to .pkl
load_risk_model()  – Load the artifact back for inference

Artifact format (dict saved as .pkl):
  {
    "model":           <fitted sklearn Pipeline>,
    "model_type":      "XGBoost" | "RandomForest" | ...,
    "feature_columns": [list of raw input column names before preprocessing],
    "metrics":         {rmse, mae, r2, ...},
    "created_at":      ISO timestamp,
    "agririsk_version":"1.0.0",
  }
"""

import os
import sys
import datetime
import joblib


from backend.config.config import Config
from ml.preprocessing import NUMERIC_FEATURES, CATEGORICAL_FEATURES


MODEL_PATH = os.path.join(Config.MODELS_DIR, "risk_model.pkl")


def save_risk_model(pipeline, metrics: dict, path: str = None) -> str:
    """
    Save the fitted Pipeline and metadata to disk.

    Args:
        pipeline : fitted sklearn Pipeline (preprocessor + model)
        metrics  : dict of evaluation metrics
        path     : optional override path (default: Config.MODELS_DIR/risk_model.pkl)

    Returns:
        Absolute path to saved file.
    """
    save_path = path or MODEL_PATH
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    artifact = {
        "model":            pipeline,
        "model_type":       metrics.get("model_type", "Unknown"),
        "feature_columns":  NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "metrics":          metrics,
        "created_at":       datetime.datetime.utcnow().isoformat() + "Z",
        "agririsk_version": "2.0.0",
        "python_module":    "ml.train_risk_model",
    }

    joblib.dump(artifact, save_path, compress=3)
    size_mb = os.path.getsize(save_path) / 1_048_576
    print(f"\n  Saved risk_model.pkl -> {save_path}  ({size_mb:.2f} MB)")
    return save_path


def load_risk_model(path: str = None) -> dict:
    """
    Load the saved model artifact.

    Returns:
        The artifact dict containing 'model', 'metrics', etc.

    Raises:
        FileNotFoundError if the .pkl file doesn't exist.
    """
    load_path = path or MODEL_PATH
    if not os.path.exists(load_path):
        raise FileNotFoundError(
            f"risk_model.pkl not found at {load_path}\n"
            "Run:  python -m ml.train_risk_model"
        )
    artifact = joblib.load(load_path)
    print(f"[save_model] Loaded risk_model.pkl from {load_path}")
    print(f"  Type: {artifact.get('model_type')}  |  "
          f"Created: {artifact.get('created_at')}")
    print(f"  Test R²: {artifact['metrics'].get('test_r2')}  |  "
          f"Test RMSE: {artifact['metrics'].get('test_rmse')}")
    return artifact
