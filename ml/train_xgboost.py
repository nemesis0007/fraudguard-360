"""Train and export a portable XGBoost challenger from the canonical 210k benchmark."""
from __future__ import annotations
import argparse, hashlib, json, math
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import xgboost as xgb
from sklearn.metrics import average_precision_score, roc_auc_score

FEATURE_ORDER = ["velocity_1h", "amount_deviation", "new_device", "shared_device_count", "location_shift", "new_payee", "card_not_present", "unusual_hour", "new_account", "identity_mismatch", "merchant_risk"]

def load(path):
    metadata, buckets = None, {key: [] for key in ("train", "validation", "test")}
    labels = {key: [] for key in buckets}
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            item = json.loads(line)
            if "_meta" in item: metadata = item["_meta"]; continue
            split = item["split"]
            buckets[split].append([float(item["features"].get(name, 0)) for name in FEATURE_ORDER])
            labels[split].append(int(item["label"]))
    if metadata is None or any(not rows for rows in buckets.values()): raise ValueError("Canonical train, validation, and test rows are required")
    return metadata, {key: (np.asarray(buckets[key], dtype=np.float32), np.asarray(labels[key], dtype=np.int8)) for key in buckets}

def confusion(y, probability, threshold):
    pred, truth = probability >= threshold, y == 1
    tp, fp = int(np.sum(pred & truth)), int(np.sum(pred & ~truth)); tn, fn = int(np.sum(~pred & ~truth)), int(np.sum(~pred & truth))
    precision = tp / (tp + fp) if tp + fp else 0; recall = tp / (tp + fn) if tp + fn else 0
    return {"precision": precision, "recall": recall, "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0, "false_positive_rate": fp / (fp + tn) if fp + tn else 0, "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn}}

def evaluate(y, probability, threshold):
    result = confusion(y, probability, threshold)
    result.update({"accuracy": float(np.mean((probability >= threshold) == y)), "roc_auc": float(roc_auc_score(y, probability)), "pr_auc": float(average_precision_score(y, probability)), "threshold": threshold})
    return {key: round(value, 6) if isinstance(value, float) else value for key, value in result.items()}

def select_threshold(y, probability):
    candidates = []
    for threshold in np.linspace(0.02, 0.98, 193):
        result = confusion(y, probability, float(threshold)); candidates.append((result["false_positive_rate"] <= .08, result["f1"], result["recall"], -result["false_positive_rate"], float(threshold)))
    feasible = [item for item in candidates if item[0]]
    return max(feasible or candidates, key=lambda item: item[1:4])[4]

def logit(probability):
    p = min(1 - 1e-9, max(1e-9, probability)); return math.log(p / (1 - p))

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--input", default="data/runtime/training-dataset.jsonl"); parser.add_argument("--output", default="models/auralis-xgb-210k-v1.json"); args = parser.parse_args()
    metadata, splits = load(Path(args.input)); x_train, y_train = splits["train"]; x_validation, y_validation = splits["validation"]; x_test, y_test = splits["test"]
    model = xgb.XGBClassifier(n_estimators=280, max_depth=5, min_child_weight=8, learning_rate=.045, subsample=.9, colsample_bytree=.9, reg_lambda=1.5, reg_alpha=.05, objective="binary:logistic", eval_metric="aucpr", tree_method="hist", random_state=2026, n_jobs=-1)
    model.fit(x_train, y_train, eval_set=[(x_validation, y_validation)], verbose=False)
    validation_probability = model.predict_proba(x_validation)[:, 1]; test_probability = model.predict_proba(x_test)[:, 1]; threshold = select_threshold(y_validation, validation_probability)
    booster = model.get_booster(); config = json.loads(booster.save_config()); base_score = float(config["learner"]["learner_model_param"]["base_score"].strip("[]")); trees = [json.loads(tree) for tree in booster.get_dump(dump_format="json")]
    identity = json.dumps({"features": FEATURE_ORDER, "trees": trees}, sort_keys=True, separators=(",", ":")); version = f"auralis-xgb-210k-{hashlib.sha256(identity.encode()).hexdigest()[:10]}"; parity_indices = [0, 1, 7, 25, 101, len(x_test) - 1]
    artifact = {"schema_version": "1.0", "model_type": "xgboost_json", "model_version": version, "feature_version": metadata["feature_version"], "created_at": datetime.now(timezone.utc).isoformat(), "feature_order": FEATURE_ORDER, "base_margin": logit(base_score), "trees": trees, "decision_threshold": round(threshold, 6), "training_manifest": {**metadata, "dataset_rows": sum(len(value[1]) for value in splits.values()), "examples": {key: len(value[1]) for key, value in splits.items()}}, "metrics": {"validation": evaluate(y_validation, validation_probability, threshold), "test": evaluate(y_test, test_probability, threshold)}, "parity_cases": [{"features": {name: float(x_test[index][position]) for position, name in enumerate(FEATURE_ORDER)}, "probability": round(float(test_probability[index]), 8)} for index in parity_indices], "limitations": ["Trained entirely on the canonical 210000-row synthetic benchmark.", "Metrics are synthetic demonstration evidence and are not production claims."]}
    destination = Path(args.output); destination.parent.mkdir(parents=True, exist_ok=True); destination.write_text(json.dumps(artifact, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(destination), "model_version": version, "metrics": artifact["metrics"], "trees": len(trees)}, indent=2))

if __name__ == "__main__": main()
