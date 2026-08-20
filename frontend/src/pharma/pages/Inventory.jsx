import React, { useState } from 'react';
import { useSearch } from '../context/searchcontext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const emptyForm = {
  medicine_id: '',
  quantity: '',
  threshold: '',
  expiry_date: '',
};

const Inventory = () => {
  const { searchTerm } = useSearch();
  const { pharmacyProfile } = useAuth();
  const { medicines, stock, loading, mutating, createStockItem, saveStockItem, deleteStockItem } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newMed, setNewMed] = useState(emptyForm);

  const getMedicine = (medicineId) => medicines.find((medicine) => medicine.medicine_id === medicineId) || {};

  const filteredStock = stock.filter((item) =>
    (getMedicine(item.medicine_id).name || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    const result = await createStockItem({
      provider_id: pharmacyProfile?.provider_id,
      medicine_id: newMed.medicine_id,
      quantity: Number(newMed.quantity),
      threshold: Number(newMed.threshold),
      expiry_date: newMed.expiry_date,
      last_updated: new Date().toISOString(),
    });

    if (result.success) {
      setShowModal(false);
      setNewMed(emptyForm);
    }
  };

  const handleSaveEdit = async () => {
    const result = await saveStockItem(editItem.stock_id, {
      quantity: Number(editItem.quantity),
      threshold: Number(editItem.threshold),
      expiry_date: editItem.expiry_date,
      last_updated: new Date().toISOString(),
    });

    if (result.success) {
      setEditItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Medicine Inventory</h1>
          <p className="page-subtitle">Live inventory records with shared create, update, and delete actions.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          Add Medicine
        </button>
      </div>

      <div className="surface-card overflow-hidden rounded-[1.75rem]">
        <div className="overflow-x-auto">
          <table className="table-shell">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Loading inventory...
                  </td>
                </tr>
              )}

              {!loading && filteredStock.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No inventory records match your search.
                  </td>
                </tr>
              )}

              {filteredStock.map((item) => {
                const medicine = getMedicine(item.medicine_id);
                const isLow = item.quantity < item.threshold;
                const isAvailable = item.quantity > 0;

                return (
                  <tr key={item.stock_id}>
                    <td>
                      <p className="font-semibold text-main">{medicine.name || 'Unknown'}</p>
                      <p className="text-sm text-soft">{medicine.category || 'N/A'}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isLow ? 'text-red-500' : 'text-main'}`}>{item.quantity}</span>
                        {isLow && (
                          <span className="status-pill" style={{ background: 'var(--danger-soft)', color: '#d95757' }}>
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className="status-pill"
                        style={{
                          background: isAvailable ? 'var(--success-soft)' : 'var(--panel-muted)',
                          color: isAvailable ? '#15956e' : 'var(--text-soft)',
                        }}
                      >
                        {isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="text-soft">{item.expiry_date}</td>
                    <td className="space-x-2">
                      <button onClick={() => setEditItem({ ...item })} className="btn-ghost px-0 py-0 text-sm text-main">
                        Edit
                      </button>
                      <button onClick={() => deleteStockItem(item.stock_id)} className="btn-ghost px-0 py-0 text-sm text-red-500">
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="surface-card relative w-full max-w-lg rounded-[1.75rem] p-8">
            <button onClick={() => setShowModal(false)} className="btn-ghost absolute right-4 top-4">
              Close
            </button>
            <h3 className="mb-6 text-xl font-bold text-main">Add New Medicine</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">Medicine</label>
                <select
                  required
                  className="input-shell"
                  value={newMed.medicine_id}
                  onChange={(event) => setNewMed({ ...newMed, medicine_id: event.target.value })}
                >
                  <option value="">Select Medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.medicine_id} value={medicine.medicine_id}>
                      {medicine.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-soft">Quantity</label>
                  <input
                    type="number"
                    required
                    className="input-shell"
                    value={newMed.quantity}
                    onChange={(event) => setNewMed({ ...newMed, quantity: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-soft">Threshold</label>
                  <input
                    type="number"
                    required
                    className="input-shell"
                    value={newMed.threshold}
                    onChange={(event) => setNewMed({ ...newMed, threshold: event.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">Expiry Date</label>
                <input
                  type="date"
                  required
                  className="input-shell"
                  value={newMed.expiry_date}
                  onChange={(event) => setNewMed({ ...newMed, expiry_date: event.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={mutating}>
                {mutating ? 'Saving...' : 'Add to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}

      {editItem && (
        <div className="modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="surface-card w-full max-w-md rounded-[1.75rem] p-8">
            <h3 className="mb-4 text-xl font-bold text-main">Update Stock</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">Quantity</label>
                <input
                  type="number"
                  className="input-shell"
                  value={editItem.quantity}
                  onChange={(event) => setEditItem({ ...editItem, quantity: event.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">Threshold</label>
                <input
                  type="number"
                  className="input-shell"
                  value={editItem.threshold}
                  onChange={(event) => setEditItem({ ...editItem, threshold: event.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">Expiry Date</label>
                <input
                  type="date"
                  className="input-shell"
                  value={editItem.expiry_date}
                  onChange={(event) => setEditItem({ ...editItem, expiry_date: event.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditItem(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="btn-primary" disabled={mutating}>
                {mutating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
