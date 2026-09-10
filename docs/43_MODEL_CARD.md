# 43 — Model Card

## Purpose

Card for the crop suitability classifier. Metrics filled **after training**, not before.

## Scope

`crop_rf` v1.

## Architecture

Row in `model_versions` + `ml/artifacts/model_card.json`.

## Inputs

Training run.

## Outputs

| Field | MVP |
| --- | --- |
| model_id | crop_rf |
| model_name | Crop recommendation Random Forest |
| version | 1.0.0 (bump on retrain) |
| dataset | crop_recommendation.csv (hash recorded) |
| training_date | set at train |
| features | N, P, K, temperature, humidity, ph, rainfall |
| target | crop label |
| metrics | from test set only |
| parameters | sklearn RF hyperparams |
| status | TRAINED / UNAVAILABLE |
| limitations | See 12–13, 41. Not scientifically validated for Andhra farms. Not yield. Not profit. |

## Data Flow

Train script writes card.

## Dependencies

Dataset license.

## Failure Cases

Untrained: status UNAVAILABLE, UI hides fake %.

## Security

Artifact integrity: sha256 in card.

## MVP Implementation

Generate during `python -m ml.train`.

## Production Extension

Sign models.

## Testing

Card SHA matches file.

## Limitations

Card is only as honest as the train script.
