-- ============================================================
-- IpêXchange — Schema Update v3.1 (Identity & Wallet Integration)
-- Run this snippet in your Supabase SQL Editor to apply changes
-- ============================================================

-- 1. Add new columns to the `users` table for Privy and Wallet tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS privy_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ens_name TEXT;

-- Safely drop the old 'name' column if it's no longer used
-- (Commented out by default to prevent accidental data loss. Uncomment if safe)
-- ALTER TABLE users DROP COLUMN IF EXISTS name;

-- 2. Add columns to `transactions` to track wallets directly (easier querying)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_wallet TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS seller_wallet TEXT;

-- 3. Create helpful indexes for the new columns to speed up profile lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_wallet ON transactions(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_wallet ON transactions(seller_wallet);

-- Done!
