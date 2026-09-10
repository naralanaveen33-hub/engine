# 24 — Voice Assistant

## Purpose

Hero feature: Telugu, English, mixed speech for questions and **requests** (not direct actuation).

## Architecture

Browser: `SpeechRecognition` (`te-IN`, `en-IN`) → POST `/ai/chat` → `speechSynthesis`.

Optional: POST `/ai/voice` audio to Groq Whisper (`whisper-large-v3`) if key present — verify current model id at runtime.

## Inputs

Audio or transcript.

## Outputs

Transcript, reply, language used.

## Data Flow

Same agent as text. UI shows transcript for correction.

## Dependencies

Chrome/Edge flags; microphone permission.

## Failure Cases

No speech API: prominent text box. Whisper 429: fall back. Empty transcript: ask to repeat.

## Security

Audio not stored by default; optional debug flag.

## MVP Implementation

Push-to-talk button on farmer home. Phrases: «నా టమాటా పొలానికి నీళ్లు పెట్టాలా?», «Should I irrigate Field 2?», «రేపు వర్షం వస్తుందా?»

## Production Extension

On-device STT; barge-in.

## Testing

Inject transcript strings in API tests (do not depend on mic in CI).

## Limitations

Code-mixed Telugu recognition is imperfect.
