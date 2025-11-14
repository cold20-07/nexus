# Stripe Payment Integration - Requirements

## Overview

Integrate Stripe payment processing to allow users to pay for services when submitting forms. This includes checkout, payment confirmation, and order tracking.

## User Stories

### As a User
1. I want to pay for services securely when submitting a form
2. I want to see the total cost before paying (including rush fees)
3. I want to receive a payment confirmation
4. I want to be able to review my order before payment

### As an Admin
1. I want to see payment status for each submission
2. I want to track successful and failed payments
3. I want to see payment amounts and dates
4. I want to be notified when payments are received

## Functional Requirements

### 1. Payment Flow

#### 1.1 Service Selection & Pricing
- Display service pricing on forms (Aid & Attendance, Nexus Letter, etc.)
- Show base price and any additional fees (rush service)
- Calculate total dynamically based on selections
- Display pricing clearly before checkout

#### 1.2 Checkout Process
- Integrate Stripe Checkout for secure payment
- Collect payment before or after form submission (configurable)
- Support credit/debit cards
- Handle payment success and failure

#### 1.3 Payment Confirmation
- Show success page after payment
- Send confirmation email with receipt
- Store payment details in database
- Link payment to form submission

### 2. Database Schema

#### 2.1 Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_submission_id UUID REFERENCES form_submissions(id),
  contact_id UUID REFERENCES contacts(id),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- pending, succeeded, failed, refunded
  payment_method TEXT, -- card, etc.
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Stripe Integration

#### 3.1 Stripe Checkout
- Create checkout session with line items
- Include service name and price
- Set success and cancel URLs
- Store session ID for tracking

#### 3.2 Webhook Handling
- Set up Stripe webhook endpoint
- Handle `checkout.session.completed` event
- Handle `payment_intent.succeeded` event
- Handle `payment_intent.failed` event
- Update payment status in database

#### 3.3 Security
- Use Stripe publishable key on frontend
- Use Stripe secret key on backend only
- Verify webhook signatures
- Never expose secret keys

### 4. User Interface

#### 4.1 Payment Button
- Add "Proceed to Payment" button on forms
- Show loading state during checkout creation
- Disable button while processing
- Show error messages if checkout fails

#### 4.2 Pricing Display
- Show pricing breakdown
- Display rush service fee if selected
- Show total amount clearly
- Include currency symbol

#### 4.3 Success Page
- Show payment confirmation
- Display order details
- Show receipt link
- Provide next steps

#### 4.4 Admin View
- Add payment status column to submissions table
- Show payment amount and date
- Display Stripe payment ID
- Add filter for paid/unpaid submissions

### 5. Form Integration

#### 5.1 Aid & Attendance Form
- Base price: $2,000
- Rush service: +$500
- Calculate total based on rush selection
- Show payment button after form validation

#### 5.2 Quick Intake Form
- Dynamic pricing based on form type selected
- Show pricing for each service type
- Calculate total before checkout

#### 5.3 Generic Forms Page
- Optional: Add service selection with pricing
- Or keep as free contact form

## Non-Functional Requirements

### Performance
- Checkout creation should complete in < 2 seconds
- Webhook processing should be fast (< 1 second)
- No blocking operations during payment

### Security
- PCI compliance through Stripe
- Secure webhook verification
- Encrypted payment data
- No storage of card details

### Reliability
- Handle webhook retries
- Idempotent payment processing
- Error logging for failed payments
- Graceful error handling

### User Experience
- Clear pricing information
- Simple checkout flow
- Mobile-friendly payment
- Clear error messages

## Acceptance Criteria

### Payment Flow
- [ ] User can see pricing before submitting form
- [ ] User can complete payment via Stripe Checkout
- [ ] Payment success redirects to confirmation page
- [ ] Payment failure shows error message
- [ ] User receives email confirmation with receipt

### Database
- [ ] Payments are stored in database
- [ ] Payment status is tracked correctly
- [ ] Payments are linked to form submissions
- [ ] Payment history is queryable

### Admin Panel
- [ ] Admins can see payment status
- [ ] Admins can view payment details
- [ ] Admins can filter by payment status
- [ ] Payment amounts are displayed correctly

### Webhooks
- [ ] Webhook endpoint is secure
- [ ] Webhook signatures are verified
- [ ] Payment status updates automatically
- [ ] Failed webhooks are logged

### Testing
- [ ] Test mode works with Stripe test keys
- [ ] Successful payment flow works
- [ ] Failed payment flow works
- [ ] Webhook processing works
- [ ] Refund handling works (if needed)

## Out of Scope (Future Enhancements)

- Subscription payments
- Payment plans / installments
- Multiple payment methods (PayPal, etc.)
- Refund processing from admin panel
- Invoice generation
- Discount codes / coupons

## Dependencies

- Stripe account (test and live)
- Stripe API keys
- Supabase Edge Functions (for webhooks)
- Email service (for receipts)

## Risks & Mitigations

### Risk: Webhook failures
**Mitigation:** Implement retry logic and manual reconciliation

### Risk: Payment but no form submission
**Mitigation:** Store payment first, then link to submission

### Risk: Form submission but no payment
**Mitigation:** Require payment before form submission or mark as unpaid

### Risk: Double charging
**Mitigation:** Use idempotency keys and check for existing payments

## Questions to Resolve

1. Should payment happen before or after form submission?
   - **Recommendation:** After form submission, before confirmation
2. What happens if payment fails?
   - **Recommendation:** Allow retry, keep form data saved
3. Should we support partial payments or deposits?
   - **Recommendation:** No, full payment only (for now)
4. What about refunds?
   - **Recommendation:** Handle manually through Stripe dashboard initially

## Success Metrics

- Payment success rate > 95%
- Checkout completion time < 30 seconds
- Zero payment data breaches
- Webhook processing success rate > 99%
