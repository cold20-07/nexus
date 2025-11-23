import { DollarSign, CreditCard, Calendar, ExternalLink, Receipt } from 'lucide-react';
import { formatPrice } from '../../lib/payment';
import PaymentStatusBadge from './PaymentStatusBadge';

const PaymentDetails = ({ payment }) => {
  if (!payment) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-600">
        <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p>No payment information available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2 text-indigo-600" />
        Payment Information
      </h3>

      <div className="space-y-4">
        {/* Status and Amount */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <p className="text-sm text-slate-600 mb-1">Status</p>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600 mb-1">Amount</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(payment.amount)}
            </p>
          </div>
        </div>

        {/* Payment Method */}
        {payment.card_brand && payment.card_last4 && (
          <div className="flex items-start">
            <CreditCard className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900">Payment Method</p>
              <p className="text-sm text-slate-600">
                {payment.card_brand.charAt(0).toUpperCase() + payment.card_brand.slice(1)} ending in {payment.card_last4}
              </p>
            </div>
          </div>
        )}

        {/* Service Details */}
        <div className="flex items-start">
          <Receipt className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900">Service</p>
            <p className="text-sm text-slate-600">
              {payment.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              {payment.is_rush_service && (
                <span className="ml-2 text-amber-600 font-medium">(Rush Service)</span>
              )}
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-start">
          <Calendar className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Created</p>
                <p className="text-sm text-slate-600">
                  {new Date(payment.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {payment.paid_at && (
                <div>
                  <p className="text-sm font-medium text-slate-900">Paid</p>
                  <p className="text-sm text-slate-600">
                    {new Date(payment.paid_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stripe Links */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          {payment.stripe_payment_intent_id && (
            <a
              href={`https://dashboard.stripe.com/payments/${payment.stripe_payment_intent_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View in Stripe Dashboard
            </a>
          )}
          {payment.receipt_url && (
            <a
              href={payment.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
            >
              <Receipt className="w-4 h-4 mr-2" />
              View Receipt
            </a>
          )}
        </div>

        {/* Customer Email */}
        {payment.receipt_email && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Receipt sent to: <span className="font-medium text-slate-900">{payment.receipt_email}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;
