"""
AgriRisk – STEP 3: Feature Engineering Pipeline
=================================================
Builds a reproducible sklearn ColumnTransformer that:

  Numeric features  → StandardScaler (+ optional PolynomialFeatures for key terms)
  Categorical       → OneHotEncoder  (soil_type)
                   → OrdinalEncoder  (season: Kharif < Rabi < Zaid)
                   → TargetEncoder   (crop – uses training-set target mean per category)

All transformers are fitted ONLY on training data to prevent data leakage.

Usage:
  from ml.feature_engineering import build_preprocessor, get_feature_names

  preprocessor = build_preprocessor()
  X_train_t = preprocessor.fit_transform(X_train, y_train)  # y_train needed for TargetEncoder
  X_test_t  = preprocessor.transform(X_test)
"""

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import (
    StandardScaler, OneHotEncoder, OrdinalEncoder
)

# sklearn 1.3+ ships TargetEncoder; fall back to label-encoding if older
try:
    from sklearn.preprocessing import TargetEncoder
    HAS_TARGET_ENC = True
except ImportError:
    HAS_TARGET_ENC = False
    from sklearn.preprocessing import LabelEncoder

from ml.preprocessing import NUMERIC_FEATURES, CATEGORICAL_FEATURES


# ── Feature groups ────────────────────────────────────────────────────────────

NUMERIC_COLS = NUMERIC_FEATURES            # all numeric inputs

SOIL_TYPE_CATS = [["Alluvial","Black","Red","Laterite",
                    "Desert","Sandy loam","Clay loam","Loamy"]]

SEASON_CATS    = [["Kharif","Rabi","Zaid"]]  # ordinal order

# crop is high-cardinality → target-encode or label-encode
CROP_COL       = ["crop"]
SOIL_COL       = ["soil_type"]
SEASON_COL     = ["season"]


# ── Builder ───────────────────────────────────────────────────────────────────

def build_preprocessor() -> ColumnTransformer:
    """
    Return an unfitted ColumnTransformer that handles all feature types.
    Call .fit_transform(X_train, y_train) on training data only.
    """
    numeric_pipe = Pipeline([
        ("scaler", StandardScaler()),
    ])

    season_pipe = Pipeline([
        ("ordinal", OrdinalEncoder(
            categories=SEASON_CATS,
            handle_unknown="use_encoded_value",
            unknown_value=-1,
        )),
    ])

    soil_pipe = Pipeline([
        ("ohe", OneHotEncoder(
            categories=SOIL_TYPE_CATS,
            handle_unknown="ignore",
            sparse_output=False,
        )),
    ])

    if HAS_TARGET_ENC:
        crop_pipe = Pipeline([
            ("te", TargetEncoder(
                categories="auto",
                target_type="continuous",
                smooth="auto",
                cv=5,
                shuffle=True,
                random_state=42,
            )),
        ])
    else:
        # Fallback: OrdinalEncoder (less powerful but no dependency issue)
        crop_pipe = Pipeline([
            ("ord", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)),
        ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num",    numeric_pipe, NUMERIC_COLS),
            ("season", season_pipe,  SEASON_COL),
            ("soil",   soil_pipe,    SOIL_COL),
            ("crop",   crop_pipe,    CROP_COL),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    return preprocessor


def get_feature_names(preprocessor: ColumnTransformer) -> list[str]:
    """Extract human-readable feature names from a fitted ColumnTransformer."""
    names = []
    for name, transformer, cols in preprocessor.transformers_:
        if name == "remainder":
            continue
        if hasattr(transformer, "get_feature_names_out"):
            names.extend(transformer.get_feature_names_out())
        elif hasattr(cols, "__iter__") and not isinstance(cols, str):
            names.extend(cols)
        else:
            names.append(str(cols))
    return names


# ── Quick test when run directly ─────────────────────────────────────────────

if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    from ml.preprocessing import load_risk_features, clean_dataframe, split_features_target
    from sklearn.model_selection import train_test_split

    df        = clean_dataframe(load_risk_features())
    X, y      = split_features_target(df)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

    pre = build_preprocessor()
    X_tr_t = pre.fit_transform(X_tr, y_tr)
    X_te_t = pre.transform(X_te)

    feat_names = get_feature_names(pre)
    print(f"Transformed train shape: {X_tr_t.shape}")
    print(f"Transformed test  shape: {X_te_t.shape}")
    print(f"Feature names ({len(feat_names)}): {feat_names[:10]} ...")
    print("TargetEncoder available:", HAS_TARGET_ENC)
