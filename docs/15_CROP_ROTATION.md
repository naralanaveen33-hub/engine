# 15 — Crop Rotation

## Purpose

Use previous crop as **one factor**, never an absolute veto.

## Scope

Family mapping and simple pest/nutrient notes for MVP.

## Architecture

`CROP_FAMILIES` dict (e.g. tomato & chilli → Solanaceae). `RotationService.adjust(score, previous, candidate)`.

## Inputs

`crop_history` latest known row or history_status.

## Outputs

Score delta + explanation strings + `source=FARMER_INPUT` for previous crop identity.

## Data Flow

Only when `history_status=KNOWN` and crop_id present.

## Dependencies

Crop catalog families.

## Failure Cases

Unknown/new/no data: delta 0, message “Previous crop not provided; rotation not applied.”

## Security

History write ACL.

## MVP Implementation

Soft penalties: same family -8; optional nitrogen-fixing previous (groundnut, pulses) small bonus to heavy feeder +4. Solanaceae repeat warning about disease pressure (knowledge, not diagnosis).

## Production Extension

Nematode/wilt break-crop tables from local extension.

## Testing

Unknown history must not equal a random crop.

## Limitations

Family lists are simplified.
