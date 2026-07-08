-- ============================================================
-- IpeXchange MVP — per-kind intent fields
-- Migration 0008 — optional listing details by kind
-- ============================================================
-- Which fields the UI shows per kind (all nullable, DB accepts any):
--   good:      condition, brand
--   service:   duration, format, is_continuous
--   digital:   access
--   knowledge: duration, format, level, is_continuous

ALTER TABLE intents
  ADD COLUMN IF NOT EXISTS condition TEXT
    CHECK (condition IS NULL OR condition IN ('new', 'used', 'refurbished')),
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS format TEXT
    CHECK (format IS NULL OR format IN ('in_person', 'online', 'hybrid')),
  ADD COLUMN IF NOT EXISTS access TEXT
    CHECK (access IS NULL OR access IN ('one_time', 'lifetime')),
  ADD COLUMN IF NOT EXISTS level TEXT
    CHECK (level IS NULL OR level IN ('beginner', 'intermediate', 'advanced'));
