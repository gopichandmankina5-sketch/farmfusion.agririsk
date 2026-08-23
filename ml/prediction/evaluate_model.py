"""
AgriRisk – ML Model Evaluation
================================
Produces a rich evaluation report including:

  - Per-risk-level accuracy breakdown
  - Residual analysis (bias, heteroskedasticity check)
  - Risk classification accuracy (LOW/MEDIUM/HIGH/CRITICAL)
  - Worst prediction analysis (highest residuals)
  - Prints a formatted report table

Called from train_risk_model.py after training.
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    confusion_matrix, classification_report
)



def classify_score(score: float) -> str:
    if score <= 30: return "LOW"
    elif score <= 55: return "MEDIUM"
    elif score <= 75: return "HIGH"
    else: return "CRITICAL"


def evaluate_and_report(y_true: pd.Series, y_pred: np.ndarray,
                        meta_df: pd.DataFrame = None) -> dict:
    """
    Full evaluation of a trained regression model on the test set.

    Args:
        y_true:   True risk scores (Series or array)
        y_pred:   Predicted risk scores (array)
        meta_df:  Optional DataFrame with same index as y_true
                  containing state, district, crop, season columns

    Returns:
        Dictionary of all computed metrics.
    """
    y_true  = np.array(y_true, dtype=float)
    y_pred  = np.array(y_pred, dtype=float)
    residuals = y_true - y_pred

    # ── Basic regression metrics ──────────────────────────────────────────
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae  = float(mean_absolute_error(y_true, y_pred))
    r2   = float(r2_score(y_true, y_pred))
    bias = float(residuals.mean())            # systematic over/under-prediction

    pct_5  = float(np.mean(np.abs(residuals) <= 5)  * 100)
    pct_10 = float(np.mean(np.abs(residuals) <= 10) * 100)

    print("\n" + "═" * 65)
    print("  DETAILED EVALUATION REPORT")
    print("═" * 65)
    print(f"\n  Regression Metrics (n={len(y_true):,})")
    print(f"  {'RMSE':<20} {rmse:.3f} pts")
    print(f"  {'MAE':<20} {mae:.3f} pts")
    print(f"  {'R²':<20} {r2:.4f}")
    print(f"  {'Mean Bias':<20} {bias:+.3f} pts  ({'over' if bias<0 else 'under'}-predicting)")
    print(f"  {'Within ±5 pts':<20} {pct_5:.1f}%")
    print(f"  {'Within ±10 pts':<20} {pct_10:.1f}%")

    # ── Residual distribution ─────────────────────────────────────────────
    res_p = np.percentile(residuals, [5, 25, 50, 75, 95])
    print(f"\n  Residual Percentiles (true - pred):")
    print(f"  {'p5':>6} {'p25':>8} {'p50':>8} {'p75':>8} {'p95':>8}")
    print(f"  {res_p[0]:>6.2f} {res_p[1]:>8.2f} {res_p[2]:>8.2f} "
          f"{res_p[3]:>8.2f} {res_p[4]:>8.2f}")

    # ── Risk level classification accuracy ───────────────────────────────
    true_levels = np.array([classify_score(s) for s in y_true])
    pred_levels = np.array([classify_score(s) for s in y_pred])

    level_match  = float(np.mean(true_levels == pred_levels) * 100)
    level_within1 = float(np.mean(_levels_within_one(true_levels, pred_levels)) * 100)

    print(f"\n  Risk Level Classification:")
    print(f"  {'Exact match':<25} {level_match:.1f}%")
    print(f"  {'Within adjacent level':<25} {level_within1:.1f}%")

    # Per-level breakdown
    print(f"\n  Per-Level Breakdown:")
    print(f"  {'Level':<12} {'N':>6} {'RMSE':>8} {'Bias':>8} {'Acc%':>8}")
    for lv in ["LOW","MEDIUM","HIGH","CRITICAL"]:
        mask = (true_levels == lv)
        if mask.sum() == 0:
            print(f"  {lv:<12} {'—':>6}")
            continue
        lv_rmse = float(np.sqrt(mean_squared_error(y_true[mask], y_pred[mask])))
        lv_bias = float((y_true[mask] - y_pred[mask]).mean())
        lv_acc  = float(np.mean(pred_levels[mask] == lv) * 100)
        print(f"  {lv:<12} {mask.sum():>6,} {lv_rmse:>8.3f} {lv_bias:>+8.3f} {lv_acc:>7.1f}%")

    # ── Confusion matrix (risk levels) ────────────────────────────────────
    labels = ["LOW","MEDIUM","HIGH","CRITICAL"]
    cm = confusion_matrix(true_levels, pred_levels, labels=labels)
    print(f"\n  Confusion Matrix (rows=true, cols=pred):")
    hdr = f"  {'':>10}" + "".join(f"{l:>10}" for l in labels)
    print(hdr)
    for i, row in enumerate(cm):
        print(f"  {labels[i]:>10}" + "".join(f"{v:>10}" for v in row))

    # ── Worst predictions ─────────────────────────────────────────────────
    abs_res = np.abs(residuals)
    worst_idx = np.argsort(abs_res)[::-1][:8]
    print(f"\n  Top 8 Worst Predictions (largest absolute residual):")
    print(f"  {'#':>3} {'True':>7} {'Pred':>7} {'Error':>7}", end="")
    if meta_df is not None:
        print(f"  {'Crop':<12} {'State':<15}", end="")
    print()
    for rank, i in enumerate(worst_idx, 1):
        err = residuals[i]
        print(f"  {rank:>3} {y_true[i]:>7.1f} {y_pred[i]:>7.1f} {err:>+7.1f}", end="")
        if meta_df is not None:
            try:
                row = meta_df.iloc[i]
                print(f"  {str(row.get('crop','?')):<12} {str(row.get('state','?')):<15}", end="")
            except Exception:
                pass
        print()

    result = {
        "rmse": rmse, "mae": mae, "r2": r2, "bias": bias,
        "pct_within_5": pct_5, "pct_within_10": pct_10,
        "level_exact_match": level_match,
        "level_within_one":  level_within1,
    }
    return result


def _levels_within_one(true_levels: np.ndarray, pred_levels: np.ndarray) -> np.ndarray:
    """Return boolean array: True if predicted level is exact or adjacent."""
    order = {"LOW":0,"MEDIUM":1,"HIGH":2,"CRITICAL":3}
    return np.array([
        abs(order.get(t,0) - order.get(p,0)) <= 1
        for t, p in zip(true_levels, pred_levels)
    ])
