import React from 'react';
import { useData } from '../context/DataContext';

const statusConfig = {
  Pending: { bg: 'var(--warning-soft)', text: '#b7791f' },
  Accepted: { bg: 'rgba(69, 135, 245, 0.14)', text: '#3068c9' },
  'Ready for Pickup': { bg: 'rgba(114, 91, 222, 0.14)', text: '#6553d2' },
  Completed: { bg: 'var(--success-soft)', text: '#15956e' },
  Rejected: { bg: 'var(--danger-soft)', text: '#d95757' },
};

const Orders = () => {
  const { orders, medicines, loading, mutating, saveOrderStatus } = useData();

  const getMedicineName = (medicineId) => medicines.find((medicine) => medicine.medicine_id === medicineId)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Order Management</h1>
        <p className="page-subtitle">Track and update prescription order fulfillment from the shared workflow state.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading && <div className="surface-card rounded-3xl p-6 text-soft">Loading orders...</div>}

        {!loading && orders.length === 0 && <div className="surface-card rounded-3xl p-6 text-soft">No order records found.</div>}

        {orders.map((order) => (
          <div key={order.order_id} className="surface-card rounded-[1.5rem] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-main">{order.order_id}</h3>
                <p className="text-xs text-faint">{order.order_time}</p>
              </div>
              <div className="status-pill" style={{ background: statusConfig[order.status].bg, color: statusConfig[order.status].text }}>
                {order.status}
              </div>
            </div>

            <div className="surface-muted mb-4 space-y-2 rounded-2xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-soft">Citizen</span>
                <span className="font-medium text-main">{order.citizen_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-soft">Medicine</span>
                <span className="font-medium text-main">{getMedicineName(order.medicine_id)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-soft">Quantity</span>
                <span className="font-medium text-main">{order.quantity}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {order.status === 'Pending' && (
                <>
                  <button onClick={() => saveOrderStatus(order.order_id, 'Accepted')} className="btn-primary flex-1" disabled={mutating}>
                    Accept
                  </button>
                  <button onClick={() => saveOrderStatus(order.order_id, 'Rejected')} className="btn-secondary flex-1" disabled={mutating}>
                    Reject
                  </button>
                </>
              )}
              {order.status === 'Accepted' && (
                <button onClick={() => saveOrderStatus(order.order_id, 'Ready for Pickup')} className="btn-primary w-full" disabled={mutating}>
                  Mark Ready for Pickup
                </button>
              )}
              {order.status === 'Ready for Pickup' && (
                <button onClick={() => saveOrderStatus(order.order_id, 'Completed')} className="btn-primary w-full" disabled={mutating}>
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
