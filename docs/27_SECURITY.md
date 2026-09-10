# 27 — Security

## Purpose

Authentication, RBAC, field isolation, command authorization.

## Scope

MVP: JWT, bcrypt, ACL, device tokens, rate limits, audit. Not full ISO27001.

## Architecture

`get_current_user` → farmer_id. Resource load → `assert_field_access`. Roles: farmer (own data), engineer (read traces + devices), admin.

## Inputs

Passwords, tokens, command payloads.

## Outputs

401/403. Audit log rows.

## Data Flow

Execute: user owns farm, field belongs to farm, device belongs to field, decision belongs to field, confirmation exists, not expired, safety pass, idempotency key.

## Dependencies

Doc 28, 07.

## Failure Cases

Stolen JWT: short expiry 8h hackathon. Device token leak: rotate in engineer UI.

## Security

HTTPS in production; hackathon LAN HTTP accepted with warning. Secrets in `.env`.

## MVP Implementation

Rate limit login 10/min. Pydantic validation. CORS frontend origin.

## Production Extension

Refresh tokens, mTLS devices, 2FA.

## Testing

Farmer B GET farmer A field → 403. Execute with swapped device_id → 403.

## Limitations

SQLite file access on the laptop is physical trust of the demo machine.
