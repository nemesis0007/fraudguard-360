"""Train a reproducible, dependency-light fraud baseline and emit a JSON artifact."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np


FEATURE_ORDER = [
    "velocity_1h",
    "amount_deviation",
    "new_device",
    "shared_device_count",
    "location_shift",
    "new_payee",
    "card_not_present",
    "unusual_hour",
    "new_account",
    "identity_mismatch",
    "merchant_risk",
]


def load_dataset(path: Path):
    metadata = None
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            item = json.loads(line)
            if "_meta" in item:
                metadata = item["_meta"]
            else:
                rows.append(item)
    if metadata is None or not rows:
        raise ValueError("Dataset must contain metadata and examples")
    return metadata, rows


def matrix(rows, split):
    selected = [row for row in rows if row["split"] == split]
    x = np.asarray(
        [[float(row["features"].get(name, 0.0)) for name in FEATURE_ORDER] for row in selected],
        dtype=np.float64,
    )
    y = np.asarray([int(row["label"]) for row in selected], dtype=np.float64)
    return x, y


def sigmoid(values):
    values = np.clip(values, -35, 35)
    return 1.0 / (1.0 + np.exp(-values))


def metrics(labels, probabilities, threshold):
    predictions = probabilities >= threshold
    truth = labels == 1
    tp = int(np.sum(predictions & truth))
    fp = int(np.sum(predictions & ~truth))
    tn = int(np.sum(~predictions & ~truth))
    fn = int(np.sum(~predictions & truth))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    fpr = fp / (fp + tn) if fp + tn else 0.0
    return {
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "f1": round(f1, 6),
        "false_positive_rate": round(fpr, 6),
        "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
    }


def train(x_train, y_train, epochs=1800, learning_rate=0.075, l2=0.003):
    means = x_train.mean(axis=0)
    scales = x_train.std(axis=0)
    scales[scales < 1e-8] = 1.0
    x = (x_train - means) / scales
    weights = np.zeros(x.shape[1], dtype=np.float64)
    bias = 0.0
    positives = max(float(np.sum(y_train)), 1.0)
    negatives = max(float(len(y_train) - np.sum(y_train)), 1.0)
    sample_weights = np.where(
        y_train == 1,
        len(y_train) / (2 * positives),
        len(y_train) / (2 * negatives),
    )
    normalizer = float(np.sum(sample_weights))

    for _ in range(epochs):
        probabilities = sigmoid(x @ weights + bias)
        error = (probabilities - y_train) * sample_weights
        weights -= learning_rate * ((x.T @ error) / normalizer + l2 * weights)
        bias -= learning_rate * float(np.sum(error) / normalizer)
    return means, scales, weights, bias


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/runtime/training-dataset.jsonl")
    parser.add_argument("--output", default="models/fraudguard-linear-v1.json")
    args = parser.parse_args()
    source = Path(args.input)
    destination = Path(args.output)
    metadata, rows = load_dataset(source)
    x_train, y_train = matrix(rows, "train")
    x_validation, y_validation = matrix(rows, "validation")
    x_test, y_test = matrix(rows, "test")
    if min(len(y_train), len(y_validation), len(y_test)) == 0:
        raise ValueError("Every dataset split must contain examples")

    means, scales, weights, bias = train(x_train, y_train)
    validation_probabilities = sigmoid(((x_validation - means) / scales) @ weights + bias)
    candidates = []
    for threshold in np.linspace(0.1, 0.9, 161):
        result = metrics(y_validation, validation_probabilities, float(threshold))
        candidates.append(
            (
                result["false_positive_rate"] <= 0.08,
                result["f1"],
                -result["false_positive_rate"],
                float(threshold),
            )
        )
    feasible = [candidate for candidate in candidates if candidate[0]]
    selected = max(feasible or candidates, key=lambda item: (item[1], item[2]))
    threshold = selected[3]

    rounded_weights = [round(float(value), 10) for value in weights]
    identity = json.dumps(
        {"features": FEATURE_ORDER, "weights": rounded_weights, "bias": round(float(bias), 10)},
        sort_keys=True,
    )
    version = f"fg-linear-{hashlib.sha256(identity.encode()).hexdigest()[:10]}"
    artifact = {
        "schema_version": "1.0",
        "model_type": "logistic_regression",
        "model_version": version,
        "feature_version": metadata["feature_version"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "feature_order": FEATURE_ORDER,
        "normalization": {
            "means": [round(float(value), 10) for value in means],
            "scales": [round(float(value), 10) for value in scales],
        },
        "weights": rounded_weights,
        "bias": round(float(bias), 10),
        "decision_threshold": round(threshold, 4),
        "training_manifest": {
            **metadata,
            "examples": {
                "train": len(y_train),
                "validation": len(y_validation),
                "test": len(y_test),
            },
            "positive_rate": round(float(np.mean(y_train)), 6),
        },
        "metrics": {
            "validation": metrics(y_validation, validation_probabilities, threshold),
            "test": metrics(
                y_test,
                sigmoid(((x_test - means) / scales) @ weights + bias),
                threshold,
            ),
        },
        "coefficient_explanations": sorted(
            [
                {"feature": name, "coefficient": round(float(value), 6)}
                for name, value in zip(FEATURE_ORDER, weights)
            ],
            key=lambda item: abs(item["coefficient"]),
            reverse=True,
        ),
        "limitations": [
            "Trained entirely on synthetic scenarios.",
            "Linear benchmark intended for comparison and fallback-safe integration, not production authorization.",
        ],
    }
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(destination),
                "model_version": version,
                "metrics": artifact["metrics"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

