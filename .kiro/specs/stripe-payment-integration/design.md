# Stripe Payment Integration - Technical Design

## Architecture Overview

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
         │ 1. Create Checkout Session
         ▼
┌─────────────────┐
│ Supabase Edge   │
│   Function      │◄──── Stripe Secret Key
└────────┬────────┘
         │
         │ 2. Return Session URL
         ▼
┌─────────────────┐
│ Stripe Checkout │
│     Page        │
└────────┬────────┘
         │
         │ 3. Payment Complete
         ▼
┌─────────────────┐
│  Stripe sends   │
│    Webhook      │
└────────┬────────┘
         │
         │ 4. Update Database
         ▼
┌─────────────────┐
│   Supabase DB   │
│   (payments)    │
└─────────────────┘
```

## Technology Stack

### Frontend
- **React** - UI components
- **@stripe/stripe-js** - Stripe client library
- **React Router** - Navigation and redirects

### Backend
- **Supabase Edge Functions** - Serverless functions for Stripe API calls
- **Stripe Node SDK** - Server-side Stripe integration
- **Supabase Database** - Payment records storage

### External Services
- **Stripe** - Payment processing
- **Stripe Webhooks** - Payment event notifications

## Database Schema

### Payments Table

```sql
CREATE TABLE payments (
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
CREATE INDEX idx_payments_form_submission ON payments(form_submission_id);
CREATE INDEX idx_payments_contact ON payments(contact_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        SELECT email FROM admin_users WHERE is_active = true
      )
    )
  );

-- System can insert/update payments (for webhooks)
CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Update form_submissions table

```sql
-- Add payment tracking to form_submissions
ALTER TABLE form_submissions
ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded')),
ADD COLUMN payment_amount INTEGER,
ADD COLUMN payment_id UUID REFERENCES payments(id);

CREATE INDEX idx_form_submissions_payment_status ON form_submissions(payment_status);
```

## API Design

### Supabase Edge Functions

#### 1. Create Checkout Session

**Endpoint:** `POST /functions/v1/create-checkout-session`

**Request:**
```json
{
  "formSubmissionId": "uuid",
  "serviceType": "aid_attendance",
  "amount": 200000,
  "isRushService": false,
  "customerEmail": "user@example.com",
  "successUrl": "https://yourdomain.com/payment/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yourdomain.com/payment/canceled"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Implementation:**
```typescript
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const { formSubmissionId, serviceType, amount, isRushService, customerEmail, successUrl, cancelUrl } = await req.json();

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: getServiceName(serviceType),
            description: isRushService ? 'Includes rush service (36-48 hours)' : 'Standard service (7-10 business days)',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      formSubmissionId,
      serviceType,
      isRushService: isRushService.toString(),
    },
  });

  // Store pending payment in database
  await supabase.from('payments').insert({
    form_submission_id: formSubmissionId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent,
    amount,
    currency: 'usd',
    status: 'pending',
    service_type: serviceType,
    is_rush_service: isRushService,
    receipt_email: customerEmail,
  });

  return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 2. Stripe Webhook Handler

**Endpoint:** `POST /functions/v1/stripe-webhook`

**Events to Handle:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Implementation:**
```typescript
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { formSubmissionId } = session.metadata;

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'processing',
      stripe_customer_id: session.customer,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', session.id);

  // Update form submission
  await supabase
    .from('form_submissions')
    .update({
      payment_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', formSubmissionId);
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Get payment method details
  const paymentMethod = await stripe.paymentMethods.retrieve(
    paymentIntent.payment_method as string
  );

  // Update payment record
  const { data: payment } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      payment_method_type: paymentMethod.type,
      card_brand: paymentMethod.card?.brand,
      card_last4: paymentMethod.card?.last4,
      receipt_url: paymentIntent.charges.data[0]?.receipt_url,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .select()
    .single();

  // Update form submission
  if (payment) {
    await supabase
      .from('form_submissions')
      .update({
        payment_status: 'paid',
        payment_amount: payment.amount,
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.form_submission_id);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}
```

## Frontend Implementation

### 1. Stripe Context Provider

```typescript
// frontend/src/contexts/StripeContext.js
import { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const StripeContext = createContext(null);

export const StripeProvider = ({ children }) => {
  return (
    <StripeContext.Provider value={stripePromise}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = () => useContext(StripeContext);
```

### 2. Payment API

```typescript
// frontend/src/lib/payment.js
import { supabase } from './supabase';

export const paymentApi = {
  async createCheckoutSession(data) {
    const { data: result, error } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: data,
      }
    );

    if (error) throw error;
    return result;
  },

  async getPaymentStatus(formSubmissionId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('form_submission_id', formSubmissionId)
      .single();

    if (error) throw error;
    return data;
  },
};
```

### 3. Payment Button Component

```jsx
// frontend/src/components/PaymentButton.js
import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { paymentApi } from '../lib/payment';
import { toast } from 'sonner';

const PaymentButton = ({ formSubmissionId, amount, serviceType, isRushService, customerEmail }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { url } = await paymentApi.createCheckoutSession({
        formSubmissionId,
        serviceType,
        amount,
        isRushService,
        customerEmail,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment/canceled`,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Processing...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          <span>Proceed to Payment (${(amount / 100).toFixed(2)})</span>
        </>
      )}
    </button>
  );
};

export default PaymentButton;
```

### 4. Payment Success Page

```jsx
// frontend/src/pages/PaymentSuccess.js
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { paymentApi } from '../lib/payment';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Fetch payment details
    // Implementation depends on how you want to retrieve payment info
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Payment Successful!</h2>
          <p className="text-slate-600 mb-6">
            Your payment has been processed successfully. You will receive a confirmation email shortly.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Our medical team will review your submission</li>
              <li>• You'll receive updates via email</li>
              <li>• Processing time: 7-10 business days (or 36-48 hours for rush)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
```

## Environment Variables

```bash
# Frontend (.env)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase Edge Functions
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Security Considerations

1. **Never expose secret keys** - Only use publishable key on frontend
2. **Verify webhook signatures** - Always verify Stripe webhook signatures
3. **Use HTTPS** - All payment pages must use HTTPS
4. **Validate amounts** - Server-side validation of payment amounts
5. **Idempotency** - Use idempotency keys to prevent duplicate charges
6. **PCI Compliance** - Never handle raw card data (Stripe handles this)

## Testing Strategy

### Test Mode
- Use Stripe test keys for development
- Test cards: `4242 4242 4242 4242` (success)
- Test cards: `4000 0000 0000 9995` (decline)

### Test Scenarios
1. Successful payment flow
2. Failed payment (declined card)
3. Canceled checkout
4. Webhook delivery
5. Duplicate payment prevention
6. Refund handling

## Deployment Checklist

- [ ] Create Stripe account
- [ ] Get API keys (test and live)
- [ ] Deploy Edge Functions
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Add environment variables
- [ ] Test payment flow in test mode
- [ ] Switch to live keys for production
- [ ] Monitor webhook deliveries
- [ ] Set up error alerting

## Monitoring & Logging

- Log all payment attempts
- Monitor webhook delivery success rate
- Alert on failed payments
- Track payment conversion rate
- Monitor for suspicious activity
