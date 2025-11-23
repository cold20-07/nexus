# Payment Components

This directory contains all payment-related React components for Stripe integration.

## Components

### PaymentButton
Main button component that initiates Stripe Checkout.

**Props:**
- `formSubmissionId` (string, required) - ID of the form submission
- `amount` (number, required) - Amount in cents
- `serviceType` (string, required) - Service type key
- `isRushService` (boolean) - Whether rush service is selected
- `customerEmail` (string, required) - Customer email for receipt
- `disabled` (boolean) - Disable button
- `className` (string) - Additional CSS classes

**Usage:**
```jsx
<PaymentButton
  formSubmissionId="uuid"
  amount={200000}
  serviceType="aid_attendance"
  isRushService={false}
  customerEmail="user@example.com"
/>
```

### PricingDisplay
Shows pricing breakdown with base price, rush fee, and total.

**Props:**
- `basePrice` (number, required) - Base price in cents
- `rushFee` (number, required) - Rush service fee in cents
- `isRushService` (boolean, required) - Whether rush service is selected
- `serviceName` (string, required) - Name of the service

**Usage:**
```jsx
<PricingDisplay
  basePrice={200000}
  rushFee={50000}
  isRushService={true}
  serviceName="Aid & Attendance Evaluation"
/>
```

### PaymentWrapper
Complete payment flow wrapper that shows pricing and payment button.

**Props:**
- `formSubmissionId` (string, required) - ID of the form submission
- `serviceType` (string, required) - Service type key
- `isRushService` (boolean) - Whether rush service is selected
- `customerEmail` (string, required) - Customer email
- `onBack` (function) - Callback for back button

**Usage:**
```jsx
<PaymentWrapper
  formSubmissionId="uuid"
  serviceType="aid_attendance"
  isRushService={false}
  customerEmail="user@example.com"
  onBack={() => setStep('form')}
/>
```

## Integration Example

Here's how to integrate payment into a form:

```jsx
import { useState } from 'react';
import { contactsApi } from '../lib/api';
import PaymentWrapper from '../components/payment/PaymentWrapper';

const MyForm = () => {
  const [step, setStep] = useState('form'); // 'form' or 'payment'
  const [formSubmissionId, setFormSubmissionId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isRushService: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Save form data to database
      const { data } = await contactsApi.submitForm({
        form_type: 'aid_attendance',
        form_data: formData,
        contact_email: formData.email,
      });

      // Store submission ID and move to payment step
      setFormSubmissionId(data.id);
      setStep('payment');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (step === 'payment') {
    return (
      <PaymentWrapper
        formSubmissionId={formSubmissionId}
        serviceType="aid_attendance"
        isRushService={formData.isRushService}
        customerEmail={formData.email}
        onBack={() => setStep('form')}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button type="submit">Submit & Pay</button>
    </form>
  );
};
```

## Service Pricing Configuration

Edit `frontend/src/lib/payment.js` to configure pricing:

```javascript
export const SERVICE_PRICING = {
  aid_attendance: {
    name: 'Aid & Attendance Evaluation',
    basePrice: 200000, // $2,000 in cents
    rushFee: 50000, // $500 in cents
  },
  nexus_letter: {
    name: 'Nexus Letter',
    basePrice: 150000,
    rushFee: 50000,
  },
  // Add more services...
};
```

## Payment Flow

1. User fills out form
2. Form is submitted and saved to database
3. `PaymentWrapper` is shown with pricing
4. User clicks "Proceed to Payment"
5. Stripe Checkout session is created
6. User is redirected to Stripe Checkout
7. User completes payment
8. Stripe redirects to success page
9. Webhook updates database with payment status

## Testing

Use Stripe test cards:

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0027 6000 3184

## Environment Variables

Required in `frontend/.env`:

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Notes

- All prices are in cents (e.g., $20.00 = 2000)
- Payment processing is handled by Stripe
- No credit card data is stored in your database
- Webhooks update payment status automatically
