import { CheckCircle, Clock, XCircle, DollarSign, RefreshCw } from 'lucide-react';

const PaymentStatusBadge = ({ status }) => {
  const statusConfig = {
    paid: {
      icon: CheckCircle,
      label: 'Paid',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    unpaid: {
      icon: DollarSign,
      label: 'Unpaid',
      className: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    refunded: {
      icon: RefreshCw,
      label: 'Refunded',
      className: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  };

  const config = statusConfig[status] || statusConfig.unpaid;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5 mr-1" />
      {config.label}
    </span>
  );
};

export default PaymentStatusBadge;
