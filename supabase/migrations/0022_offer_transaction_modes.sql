-- Make direct purchase an explicit seller choice while preserving the behavior
-- of legacy priced offers that were already payable.
ALTER TABLE intents
  ADD COLUMN transaction_mode TEXT NOT NULL DEFAULT 'exchange',
  ADD COLUMN accepted_payment_tokens TEXT[] NOT NULL DEFAULT '{}';

UPDATE intents
SET transaction_mode = 'both',
    accepted_payment_tokens = ARRAY['usdc', 'eth', 'eurc', 'cbbtc']::TEXT[]
WHERE direction = 'offer' AND price_fiat > 0;

ALTER TABLE intents
  ADD CONSTRAINT intents_transaction_mode_check
    CHECK (transaction_mode IN ('exchange', 'buy_now', 'both')),
  ADD CONSTRAINT intents_transaction_direction_check
    CHECK (direction = 'offer' OR transaction_mode = 'exchange'),
  ADD CONSTRAINT intents_payment_configuration_check
    CHECK (
      (transaction_mode = 'exchange' AND cardinality(accepted_payment_tokens) = 0)
      OR
      (transaction_mode IN ('buy_now', 'both') AND price_fiat > 0
        AND cardinality(accepted_payment_tokens) > 0)
    ),
  ADD CONSTRAINT intents_accepted_payment_tokens_check
    CHECK (accepted_payment_tokens <@ ARRAY['usdc', 'eth', 'eurc', 'cbbtc']::TEXT[]);
