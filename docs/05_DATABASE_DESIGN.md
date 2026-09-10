# 05 — Database Design

## Purpose

Relational schema for field-centric operations, lineage, and audit.

## Scope

MVP SQLite tables. Types use SQLAlchemy; UUIDs as strings.

## Architecture

Farmer 1—N Farm 1—N Field (core). Devices N—1 Field. Decisions N—1 Field.

## Inputs

Domain entities from the master prompt.

## Outputs

Tables and key columns (not every index listed).

## Data Flow

Repositories persist engines’ structured results; never raw LLM text as source of truth for numbers.

## Dependencies

SQLAlchemy 2, Alembic (optional for hackathon: `create_all`).

## Failure Cases

FK violations rejected. Missing previous crop stored as `history_status=UNKNOWN|NEW_FIELD|NO_DATA`, not a fake crop row.

## Security

`farmer_id` on farms/fields; queries always filter by authenticated farmer unless engineer/admin.

## MVP Implementation

### Enums

`DataSource`: REAL_SENSOR, WEATHER_API, EXTERNAL_API, FARMER_INPUT, HISTORICAL, ESTIMATED, MODEL_OUTPUT, SIMULATION, AI_EXPLANATION, IMPORTED_DATA.

`UserRole`: farmer, engineer, admin.

`GrowthStage`: GERMINATION, VEGETATIVE, FLOWERING, FRUITING, MATURITY.

`IrrigationAction`: IRRIGATE, DELAY, DO_NOT_IRRIGATE.

`SensorHealth`: HEALTHY, WARNING, OFFLINE, INVALID.

`CommandStatus`: PENDING, AUTHORIZED, SENT, EXECUTED, FAILED, EXPIRED, CANCELLED.

### Tables (logical)

- `users`(id, email unique, password_hash, role, created_at)
- `farmers`(id, user_id unique, display_name, language_pref)
- `farms`(id, farmer_id, name, lat, lon, area_m2, water_source, irrigation_infrastructure, created_at, updated_at)
- `fields`(id, farm_id, farmer_id, name, lat, lon, area_m2, soil_type, water_availability, irrigation_method, created_at, updated_at)
- `field_boundaries`(id, field_id, geojson, area_m2_calculated, source)
- `crops`(id, code unique, name_en, name_te, family, typical_duration_days)
- `crop_profiles`(crop_id, kc_by_stage_json, moisture_thresholds_json, season_notes, water_mm_assumptions, rule_version)
- `field_crops`(id, field_id, crop_id, stage, planting_date, area_fraction, is_current, mixed_group_id)
- `crop_history`(id, field_id, crop_id nullable, variety, season, planting_date, harvest_date, area_m2, yield, fertilizer, disease, pest, irrigation_notes, history_status, source, created_at)
- `soil_profiles`(id, field_id, ph, n, p, k, oc, sand, silt, clay, texture, bulk_density, cec, source, provider, retrieved_at, is_lab_test boolean)
- `soil_observations`(id, field_id, observed_at, metrics_json, source)
- `weather_observations` / `weather_forecasts`(id, field_id, provider, lat, lon, retrieved_at, payload_json, et0, precip_prob, quality)
- `climate_summaries`(id, field_id, period, stats_json, source=HISTORICAL, provider)
- `market_observations`(id, crop_id, market, price, retrieved_at, source, stale)
- `devices`(id, field_id, hardware_id unique, type, token_hash, last_seen_at, actuator_ok)
- `sensors`(id, device_id, kind, unit)
- `sensor_readings`(id, sensor_id, field_id, device_id, ts, value, source=REAL_SENSOR, raw)
- `sensor_health_snapshots`(id, device_id, status, reasons_json, ts)
- `crop_analyses`(id, field_id, farmer_id, created_at, model_version, rule_version, inputs_json, sources_json)
- `crop_recommendations`(id, analysis_id, crop_id, score, rank, positives_json, negatives_json, warnings_json, constraints_json)
- `irrigation_decisions`(id, public_code, field_id, farmer_id, farm_id, crop, action, litres_estimated, duration_s, reason_codes_json, confidence, data_quality, freshness, rule_version, mode REAL|SIMULATION, inputs_json, sources_json, created_at, expires_at)
- `irrigation_executions`(id, decision_id, command_id, started_at, ended_at, litres_estimated, litres_actual nullable, litres_actual_source, status, trigger)
- `alerts`(id, farmer_id, farm_id, field_id, type, severity, message, source, ts, ack, resolved, debounce_key)
- `commands`(id, farmer_id, farm_id, field_id, device_id, decision_id, idempotency_key unique, requested_by, auth_status, exec_status, created_at, expires_at, payload_json)
- `command_authorizations`(id, command_id, user_id, ts, method)
- `decision_traces`(id, decision_id, blob_json)
- `audit_logs`(id, actor, action, entity, entity_id, ts, meta_json)
- `ai_conversations`(id, farmer_id, messages_json, lang)
- `ai_tool_calls`(id, conversation_id, tool, args_json, result_summary, ts)
- `voice_interactions`(id, conversation_id, stt_text, tts_used, provider)
- `model_versions`(id, model_name, version, dataset, trained_at, features_json, target, metrics_json, params_json, status, limitations)
- `simulation_runs`(id, field_id, scenario, overlay_json, decision_id, created_at)
- `knowledge_documents`(id, title, body, tags, source)

## Production Extension

PostGIS for polygons; Timescale for readings; encrypt device tokens at rest.

## Testing

Migration smoke; FK farmer isolation queries.

## Limitations

SQLite concurrent writes; geojson not spatially indexed.
