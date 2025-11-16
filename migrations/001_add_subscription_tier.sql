-- Migration: Add subscription_tier to users table
-- Description: Adds subscription_tier column to track user plan (basic or premium)
-- Date: 2025-11-16

-- Add subscription_tier column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium'));

-- Update existing users to have basic tier
UPDATE users
SET subscription_tier = 'basic'
WHERE subscription_tier IS NULL;

-- Add comment to column
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: basic or premium';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
