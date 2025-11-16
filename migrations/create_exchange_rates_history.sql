-- Migration: Create exchange_rates_history table
-- Description: Store historical exchange rates per user per month for accurate historical balance calculations

CREATE TABLE IF NOT EXISTS exchange_rates_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,  -- Store as last day of month: "2025-01-31", "2025-02-28"
  rates JSONB NOT NULL, -- {"USD": 0.92, "BDT": 0.0084, "EUR": 1}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_month UNIQUE(user_id, month)
);

-- Create index for faster lookups by user and month
CREATE INDEX IF NOT EXISTS idx_exchange_rates_user_month
ON exchange_rates_history(user_id, month DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE exchange_rates_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own exchange rate history
CREATE POLICY "Users can view their own exchange rates history"
ON exchange_rates_history FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own exchange rate history
CREATE POLICY "Users can insert their own exchange rates history"
ON exchange_rates_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own exchange rate history
CREATE POLICY "Users can update their own exchange rates history"
ON exchange_rates_history FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own exchange rate history
CREATE POLICY "Users can delete their own exchange rates history"
ON exchange_rates_history FOR DELETE
USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE exchange_rates_history IS 'Stores monthly snapshots of exchange rates for historical balance calculations';
