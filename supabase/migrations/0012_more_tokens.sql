-- Fase 15 — EURC and cbBTC join the on-chain checkout.
ALTER TABLE payments DROP CONSTRAINT payments_token_check;
ALTER TABLE payments ADD CONSTRAINT payments_token_check
  CHECK (token IN ('eth', 'usdc', 'eurc', 'cbbtc'));
