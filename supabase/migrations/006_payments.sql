-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  form_submission_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Stripe IDs
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Payment Details
  amount INTEGER NOT NULL, -- in cents (e.g., 200000 = $2000.00)
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')),
  
  -- Payment Method
  payment_method_type TEXT, -- card, etc.
  card_brand TEXT, -- visa, mastercard, etc.
  card_last4 TEXT,
  
  -- Metadata
  service_type TEXT, -- aid_attendance, nexus_letter, etc.
  is_rush_service BOOLEAN DEFAULT FALSE,
  
  -- URLs and Receipts
  receipt_url TEXT,
  receipt_email TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_form_submission ON payments(form_submission_id);
CREATE INDEX IF NOT EXISTS idx_payments_contact ON payments(contact_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Add payment tracking to form_submissions
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_payment_status ON form_submissions(payment_status);

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all payments (admin panel)
-- Note: Further restrict this based on your admin authentication setup
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage payments (for webhooks)
CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update trigger for payments
CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();
