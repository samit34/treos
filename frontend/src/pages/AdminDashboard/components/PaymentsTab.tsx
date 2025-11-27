import { useMemo, useState } from 'react';
import { Payment } from '../../../types';

interface PaymentsTabProps {
  payments: Payment[];
}

const PaymentsTab = ({ payments }: PaymentsTabProps) => {
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  const filteredPayments = useMemo(() => {
    if (paymentStatusFilter === 'all') return payments;
    return payments.filter((p: any) => p.status === paymentStatusFilter);
  }, [payments, paymentStatusFilter]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">All Payments</h3>
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Transaction ID</th>
              <th className="py-2 pr-4">Client</th>
              <th className="py-2 pr-4">Worker</th>
              <th className="py-2 pr-4">Job</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((p: any) => (
                <tr key={p._id} className="border-b">
                  <td className="py-2 pr-4">{p.transactionId || p._id}</td>
                  <td className="py-2 pr-4">
                    {p.client?.firstName} {p.client?.lastName}
                    <br />
                    <span className="text-xs text-gray-500">{p.client?.email}</span>
                  </td>
                  <td className="py-2 pr-4">
                    {p.worker?.firstName} {p.worker?.lastName}
                    <br />
                    <span className="text-xs text-gray-500">{p.worker?.email}</span>
                  </td>
                  <td className="py-2 pr-4">{p.job?.title || 'N/A'}</td>
                  <td className="py-2 pr-4 font-medium">${p.amount}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        p.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : p.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsTab;

