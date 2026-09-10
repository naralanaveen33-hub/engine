# 23 — RAG Architecture

## Purpose

Agricultural knowledge for explanations — not a substitute for sensors or engines.

## Scope

Bundled markdown in `knowledge/` (crop notes, irrigation safety, Telugu glosses). No live web scrape in MVP.

## Architecture

`AgriculturalKnowledgeService`: keyword / simple vector optional.

MVP: SQLite FTS5 or in-memory TF-IDF over documents. If embeddings added later, still cannot override engine numbers.

## Inputs

Query + crop/field tags.

## Outputs

Passages labeled `AGRICULTURAL_KNOWLEDGE` with document source.

## Data Flow

Agent tool `search_knowledge` after facts loaded.

## Dependencies

Bundled files with citations (e.g. generic extension practices, not copyrighted manuals pasted wholesale).

## Failure Cases

No hit: say knowledge base has no passage.

## Security

Documents are static; no user upload in MVP.

## MVP Implementation

5–15 short notes: tomato watering caution, chilli, groundnut rotation, rain delay rationale.

## Production Extension

Proper embeddings, ICAR licensed content.

## Testing

Query does not change irrigation action vs engine.

## Limitations

Not comprehensive agronomy advice.
