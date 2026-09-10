# 12 — Crop Dataset

## Purpose

Document the training data **after inspection**. Until the CSV is vendored, treat metrics as unknown.

## Scope

MVP classifier dataset only. Not a yield dataset. Not a Telangana/Andhra plot census.

## Architecture

File expected at `ml/data/crop_recommendation.csv`. Training script refuses to invent rows.

## Inputs

Public Crop Recommendation table used widely in education:

| Column | Meaning | In RF? |
| --- | --- | --- |
| N | Nitrogen (dataset units) | yes |
| P | Phosphorus | yes |
| K | Potassium | yes |
| temperature | °C | yes |
| humidity | % | yes |
| ph | soil pH | yes |
| rainfall | mm (period as in dataset; **not** live daily rain) | yes |
| label | crop class | target |

Typical published copies: ~2200 rows, 22 classes, often no nulls. **Verify on load.**

## Outputs

`dataset_card.json`: row count, class counts, missingness, license text as found in the vendored copy.

## Data Flow

EDA in `ml/inspect_dataset.py` → train. Application features not in columns stay out of the model.

## Dependencies

License of the **specific file we ship**. Common Kaggle mirrors claim CC0 or Apache-2.0; record the file we actually include. Do not scrape copyrighted books.

## Failure Cases

File missing: skip training; API sets `ml_status=UNAVAILABLE`. Schema mismatch: abort train.

## Security

No PII in dataset.

## MVP Implementation

Vendor a license-clear CSV. Print class balance. Stratified split.

## Production Extension

Andhra Pradesh farm trials; seasonal rainfall definitions aligned to kharif/rabi.

## Testing

Assert columns; assert no extra features sneak into `joblib` feature_names_in_.

## Limitations

Classes and NPK ranges may not represent local soils. Rainfall feature is **not** the Open-Meteo 24h forecast. Using live rainfall as the `rainfall` feature is an approximation and must be labeled; prefer climate monthly/seasonal rainfall for that slot when available (`HISTORICAL` or `WEATHER_API` with documented mapping).
