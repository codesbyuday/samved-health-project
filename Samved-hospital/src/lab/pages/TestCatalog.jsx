import React, { useState } from 'react';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatCurrency } from '../lib/format';

const initialForm = {
  test_name: '',
  test_category: '',
  description: '',
  price: '',
};

const TestCatalog = () => {
  const { providerCatalog, createCatalogTest, saving } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const addTest = async (event) => {
    event.preventDefault();
    await createCatalogTest(form);
    setForm(initialForm);
    setIsModalOpen(false);
  };

  return (
    <div className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1 className="section-title">Test catalog</h1>
          <p className="section-copy">Catalog entries now read from `lab_tests` and join to `test_types` in your Supabase schema.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <i className="fa-solid fa-plus"></i>
          <span>Add Test</span>
        </button>
      </div>

      <div className="card-grid">
        {providerCatalog.map((test) => (
          <article key={test.lab_test_id} className="panel catalog-card">
            <div className="stat-icon">
              <i className="fa-solid fa-vial"></i>
            </div>
            <h3 className="subsection-title mt-4">{test.test_types?.test_name || `Test ${test.test_type_id}`}</h3>
            <p className="row-copy mt-2">{test.test_types?.test_category || 'Uncategorized'}</p>
            <p className="row-copy mt-3">{test.test_types?.description || 'No description added yet.'}</p>
            <div className="catalog-footer">
              <span className="catalog-price">{formatCurrency(test.price)}</span>
              <span className="status-pill">Live</span>
            </div>
          </article>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Test to Catalog">
        <form onSubmit={addTest} className="form-stack">
          <label className="field">
            <span>Test Name</span>
            <input type="text" value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} required />
          </label>
          <label className="field">
            <span>Category</span>
            <input type="text" value={form.test_category} onChange={(e) => setForm({ ...form, test_category: e.target.value })} required />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3"></textarea>
          </label>
          <label className="field">
            <span>Price</span>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </label>
          <button type="submit" disabled={saving} className="btn-primary justify-center">
            {saving ? 'Saving...' : 'Add Test'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TestCatalog;
