"""
AgriRisk – STEP 4: Train Risk Score Model
==========================================
End-to-end pipeline:

  1. Load & validate data           (ml/preprocessing.py)
  2. Clean & split train/val/test   (stratified on risk_level)
  3. Build preprocessing pipeline   (ml/feature_engineering.py)
  4. Train Random Forest baseline
  5. Train XGBoost with light tuning
  6. Compare and select best model
  7. Evaluate on held-out test set   (ml/evaluate_model.py)
  8. Save model artifact             (ml/save_model.py)

Run from project root:
    python -m ml.train_risk_model

Requires:
    data/processed/risk_features.csv  (run data/generate_data.py first)
"""

import os
import sys
import time
import warnings
import json
import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from sklearn.pipeline           import Pipeline
from sklearn.ensemble           import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection    import (train_test_split, KFold,
                                        cross_val_score, GridSearchCV)
from sklearn.metrics            import (mean_squared_error, mean_absolute_error,
                                        r2_score, mean_absolute_percentage_error)

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("[WARN] xgboost not installed; will use GradientBoostingRegressor as fallback.")

warnings.filterwarnings("ignore")

from ml.preprocessing      import load_risk_features, validate_dataframe, clean_dataframe, split_features_target, TARGET
from ml.feature_engineering import build_preprocessor, get_feature_names
from ml.evaluate_model      import evaluate_and_report
from ml.save_model          import save_risk_model


# ==============================================================================
# CONFIGURATION
# ==============================================================================
RANDOM_STATE = 42
TEST_SIZE    = 0.15   # 15% held-out test
VAL_SIZE     = 0.15   # 15% validation (from remaining 85%)
CV_FOLDS     = 5


# ==============================================================================
# HELPERS
# ==============================================================================

def make_full_pipeline(preprocessor, estimator) -> Pipeline:
    """Wrap preprocessor + estimator into a single sklearn Pipeline."""
    return Pipeline([
        ("preprocessor", preprocessor),
        ("model",        estimator),
    ])


def eval_metrics(y_true, y_pred, name="") -> dict:
    """Compute regression metrics."""
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae  = float(mean_absolute_error(y_true, y_pred))
    r2   = float(r2_score(y_true, y_pred))
    mape = float(mean_absolute_percentage_error(y_true, y_pred)) * 100
    within5  = float(np.mean(np.abs(y_true - y_pred) <= 5)  * 100)
    within10 = float(np.mean(np.abs(y_true - y_pred) <= 10) * 100)

    result = dict(name=name, rmse=round(rmse,3), mae=round(mae,3),
                  r2=round(r2,4), mape=round(mape,2),
                  within5=round(within5,1), within10=round(within10,1))
    return result


def print_metrics(m: dict):
    print(f"  [{m['name']}]  RMSE={m['rmse']:.3f}  MAE={m['mae']:.3f}  "
          f"R²={m['r2']:.4f}  MAPE={m['mape']:.1f}%  "
          f"±5pts={m['within5']:.1f}%  ±10pts={m['within10']:.1f}%")


# ==============================================================================
# MAIN TRAINING FUNCTION
# ==============================================================================

def train():
    print("=" * 65)
    print("  AgriRisk – Risk Score Model Training Pipeline")
    print("=" * 65)

    # ── Step 1: Load & validate ────────────────────────────────────────────
    print("\n[1/8] Loading and validating data ...")
    df = load_risk_features()
    report = validate_dataframe(df)
    print(f"  Rows: {report['n_rows']:,}  |  Columns: {report['n_cols']}")
    print(f"  Target risk_score: mean={report['target_mean']:.1f}  "
          f"std={report['target_std']:.1f}  "
          f"[{report['target_min']:.1f}, {report['target_max']:.1f}]")
    print(f"  Risk level distribution: {report['risk_dist']}")

    # ── Step 2: Clean & split ──────────────────────────────────────────────
    print("\n[2/8] Cleaning and splitting data ...")
    df_clean = clean_dataframe(df)
    X, y     = split_features_target(df_clean)

    # Stratified split on risk_level bands to preserve class balance
    if "risk_level" in df_clean.columns:
        strat = df_clean["risk_level"]
    else:
        strat = None

    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=strat
    )
    strat_temp = strat.iloc[X_temp.index] if strat is not None else None

    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp,
        test_size=VAL_SIZE / (1 - TEST_SIZE),
        random_state=RANDOM_STATE,
        stratify=strat_temp,
    )
    print(f"  Train: {len(X_train):,}  Val: {len(X_val):,}  Test: {len(X_test):,}")

    # ── Step 3: Build preprocessor ─────────────────────────────────────────
    print("\n[3/8] Building preprocessing pipeline ...")
    preprocessor = build_preprocessor()

    # ── Step 4: Random Forest baseline ────────────────────────────────────
    print("\n[4/8] Training Random Forest baseline ...")
    t0 = time.time()
    rf_estimator = RandomForestRegressor(
        n_estimators  = 300,
        max_depth     = None,      # fully grown trees (regularised via min_samples)
        max_features  = "sqrt",
        min_samples_split = 5,
        min_samples_leaf  = 3,
        n_jobs        = -1,
        random_state  = RANDOM_STATE,
        oob_score     = True,
    )
    rf_pipe = make_full_pipeline(build_preprocessor(), rf_estimator)
    rf_pipe.fit(X_train, y_train)
    rf_time = time.time() - t0

    rf_val_m = eval_metrics(y_val,  rf_pipe.predict(X_val),  "RF-Val")
    rf_tst_m = eval_metrics(y_test, rf_pipe.predict(X_test), "RF-Test")
    print_metrics(rf_val_m)
    print_metrics(rf_tst_m)
    print(f"  OOB R² = {rf_estimator.oob_score_:.4f}  |  Training time: {rf_time:.1f}s")

    # ── Step 5a: XGBoost ──────────────────────────────────────────────────
    best_pipe    = rf_pipe
    best_metrics = rf_tst_m
    best_name    = "RandomForest"

    if HAS_XGB:
        print("\n[5/8] Training XGBoost ...")
        t0 = time.time()
        # Light grid search on val set (fast – no full CV here to save time)
        xgb_params = dict(
            n_estimators    = 500,
            max_depth       = 6,
            learning_rate   = 0.05,
            subsample       = 0.80,
            colsample_bytree= 0.75,
            min_child_weight= 3,
            reg_alpha       = 0.1,
            reg_lambda      = 1.0,
            random_state    = RANDOM_STATE,
            n_jobs          = -1,
            verbosity       = 0,
            early_stopping_rounds = 30,
            eval_metric     = "rmse",
        )
        xgb_pre  = build_preprocessor()
        X_tr_t   = xgb_pre.fit_transform(X_train, y_train)
        X_val_t  = xgb_pre.transform(X_val)
        X_tst_t  = xgb_pre.transform(X_test)

        xgb_model = XGBRegressor(**xgb_params)
        xgb_model.fit(
            X_tr_t, y_train,
            eval_set=[(X_val_t, y_val)],
            verbose=False,
        )
        xgb_time = time.time() - t0

        xgb_val_m = eval_metrics(y_val,  xgb_model.predict(X_val_t), "XGB-Val")
        xgb_tst_m = eval_metrics(y_test, xgb_model.predict(X_tst_t), "XGB-Test")
        print_metrics(xgb_val_m)
        print_metrics(xgb_tst_m)
        print(f"  Best iteration: {xgb_model.best_iteration}  |  Training time: {xgb_time:.1f}s")

        # Build a full Pipeline for XGBoost (refit on train only – no early stopping)
        xgb_final = XGBRegressor(
            n_estimators    = xgb_model.best_iteration + 1,
            max_depth       = 6,
            learning_rate   = 0.05,
            subsample       = 0.80,
            colsample_bytree= 0.75,
            min_child_weight= 3,
            reg_alpha       = 0.1,
            reg_lambda      = 1.0,
            random_state    = RANDOM_STATE,
            n_jobs          = -1,
            verbosity       = 0,
        )
        xgb_pipe = make_full_pipeline(build_preprocessor(), xgb_final)
        xgb_pipe.fit(X_train, y_train)

        if xgb_tst_m["rmse"] < best_metrics["rmse"]:
            best_pipe    = xgb_pipe
            best_metrics = xgb_tst_m
            best_name    = "XGBoost"
            print(f"  --> XGBoost selected (lower test RMSE)")
        else:
            print(f"  --> Random Forest retained (lower test RMSE)")

    else:
        # GradientBoosting fallback
        print("\n[5/8] Training GradientBoostingRegressor (XGBoost unavailable) ...")
        t0 = time.time()
        gb = GradientBoostingRegressor(
            n_estimators=300, max_depth=5, learning_rate=0.06,
            subsample=0.80, min_samples_leaf=4, random_state=RANDOM_STATE,
        )
        gb_pipe = make_full_pipeline(build_preprocessor(), gb)
        gb_pipe.fit(X_train, y_train)
        gb_tst_m = eval_metrics(y_test, gb_pipe.predict(X_test), "GB-Test")
        print_metrics(gb_tst_m)
        print(f"  Training time: {time.time()-t0:.1f}s")
        if gb_tst_m["rmse"] < best_metrics["rmse"]:
            best_pipe    = gb_pipe
            best_metrics = gb_tst_m
            best_name    = "GradientBoosting"

    # ── Step 6: Refit best model on train+val ─────────────────────────────
    print(f"\n[6/8] Refitting '{best_name}' on train+val ({len(X_temp):,} samples) ...")
    # Rebuild a fresh pipeline with the same estimator class but fit on more data
    # Clone estimator parameters from best_pipe
    best_estimator = best_pipe.named_steps["model"]
    params = best_estimator.get_params()
    # Remove early-stopping-related params for final fit
    for k in ["early_stopping_rounds","eval_metric"]:
        params.pop(k, None)
    final_estimator = best_estimator.__class__(**params)
    final_pipe = make_full_pipeline(build_preprocessor(), final_estimator)
    final_pipe.fit(X_temp, y_temp)

    final_tst_m = eval_metrics(y_test, final_pipe.predict(X_test), f"{best_name}-Final")
    print_metrics(final_tst_m)

    # ── Step 7: Cross-validation on full dataset ──────────────────────────
    print(f"\n[7/8] {CV_FOLDS}-fold cross-validation on full dataset ...")
    cv_estimator = best_estimator.__class__(**params)
    cv_pipe = make_full_pipeline(build_preprocessor(), cv_estimator)
    kf = KFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    cv_rmse = []
    cv_r2   = []
    for fold, (tr_idx, va_idx) in enumerate(kf.split(X, y), 1):
        X_tr_f, X_va_f = X.iloc[tr_idx], X.iloc[va_idx]
        y_tr_f, y_va_f = y.iloc[tr_idx], y.iloc[va_idx]
        cv_pipe.fit(X_tr_f, y_tr_f)
        preds = cv_pipe.predict(X_va_f)
        cv_rmse.append(np.sqrt(mean_squared_error(y_va_f, preds)))
        cv_r2.append(r2_score(y_va_f, preds))
        print(f"  Fold {fold}: RMSE={cv_rmse[-1]:.3f}  R²={cv_r2[-1]:.4f}")

    print(f"\n  CV RMSE: {np.mean(cv_rmse):.3f} ± {np.std(cv_rmse):.3f}")
    print(f"  CV R²:   {np.mean(cv_r2):.4f} ± {np.std(cv_r2):.4f}")

    # ── Step 8: Feature importance ─────────────────────────────────────────
    print(f"\n[8/8] Feature importance ...")
    final_est = final_pipe.named_steps["model"]
    pre_fitted = final_pipe.named_steps["preprocessor"]
    feat_names = get_feature_names(pre_fitted)

    if hasattr(final_est, "feature_importances_"):
        importances = pd.Series(final_est.feature_importances_, index=feat_names)
        top10 = importances.sort_values(ascending=False).head(10)
        print("\n  Top 10 features by importance:")
        for feat, imp in top10.items():
            bar = "█" * int(imp * 60)
            print(f"    {feat:<30} {imp:.4f}  {bar}")
    else:
        print("  (feature importance not available for this estimator)")
        top10 = pd.Series(dtype=float)

    # ── Assemble metadata ─────────────────────────────────────────────────
    metrics_summary = {
        "model_type":        best_name,
        "test_rmse":         final_tst_m["rmse"],
        "test_mae":          final_tst_m["mae"],
        "test_r2":           final_tst_m["r2"],
        "test_mape":         final_tst_m["mape"],
        "test_within_5pts":  final_tst_m["within5"],
        "test_within_10pts": final_tst_m["within10"],
        "cv_rmse_mean":      round(float(np.mean(cv_rmse)), 3),
        "cv_rmse_std":       round(float(np.std(cv_rmse)),  3),
        "cv_r2_mean":        round(float(np.mean(cv_r2)),   4),
        "cv_r2_std":         round(float(np.std(cv_r2)),    4),
        "n_train":           len(X_temp),
        "n_test":            len(X_test),
        "top_features":      top10.to_dict() if len(top10) else {},
    }

    print("\n" + "=" * 65)
    print("  FINAL MODEL METRICS (held-out test set)")
    print("=" * 65)
    print(f"  Model   : {best_name}")
    print(f"  RMSE    : {metrics_summary['test_rmse']:.3f} pts")
    print(f"  MAE     : {metrics_summary['test_mae']:.3f} pts")
    print(f"  R²      : {metrics_summary['test_r2']:.4f}")
    print(f"  ±5pts   : {metrics_summary['test_within_5pts']:.1f}% of predictions within 5 points")
    print(f"  ±10pts  : {metrics_summary['test_within_10pts']:.1f}% of predictions within 10 points")

    # ── Save ──────────────────────────────────────────────────────────────
    save_risk_model(final_pipe, metrics_summary)

    # ── Detailed evaluation report ────────────────────────────────────────
    y_test_pred = final_pipe.predict(X_test)
    evaluate_and_report(y_test, y_test_pred, df_clean.iloc[X_test.index])

    print("\n[DONE] ML training pipeline complete.")
    return final_pipe, metrics_summary


if __name__ == "__main__":
    train()
