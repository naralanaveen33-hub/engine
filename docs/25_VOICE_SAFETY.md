# 25 — Voice Safety

## Purpose

Voice must not turn on the pump.

## Scope

Any utterance including “turn on irrigation”, «నీళ్లు పెట్టు».

## Architecture

```
VOICE → intent → field ID → irrigation engine → safety → CONFIRM UI
  → farmer yes (button or explicit second turn with confirmation_id)
  → authorization → ESP32
```

## Inputs

Transcript; never GPIO.

## Outputs

Spoken recap of engine decision + “Shall I start irrigation? Reply yes in the app.”

## Data Flow

`execute_authorized_irrigation` requires `confirmation_id` issued by `request_irrigation_confirmation` after a stored decision.

A second spoken “yes” may call confirm **only** if the UI/session has an active pending confirmation for that field (server-side session flag), still not LLM-only.

## Dependencies

Command model, safety.

## Failure Cases

Wrong field name: ask. Multiple fields: disambiguate. Expired decision: re-evaluate.

## Security

Spoken “yes” without pending confirmation_id → no-op.

## MVP Implementation

Prefer on-screen Confirm for judging reliability; voice asks then farmer taps Confirm.

## Production Extension

Voice PIN.

## Testing

STT “start pump now” without confirm → 403.

## Limitations

Accidental yes is still a risk — prefer tap confirm in demo.
