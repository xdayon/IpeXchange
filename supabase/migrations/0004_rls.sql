-- Defense in depth: all data access goes through the Worker using the
-- service role key, which bypasses RLS. Enabling RLS with no policies
-- means the anon and authenticated roles are denied everything, so a
-- leaked or accidentally created public key cannot read or write data.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_cycle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
