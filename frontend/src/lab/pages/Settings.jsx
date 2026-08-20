import React, { useEffect, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { currentProvider, providers, wards, selectProvider, updateProviderProfile, saving } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({
    name: currentProvider.name || '',
    phone: currentProvider.phone || '',
    address: currentProvider.address || '',
    email: currentProvider.email || '',
    license: currentProvider.license || '',
    ward_id: currentProvider.ward_id || '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      name: currentProvider.name || '',
      phone: currentProvider.phone || '',
      address: currentProvider.address || '',
      email: currentProvider.email || '',
      license: currentProvider.license || '',
      ward_id: currentProvider.ward_id || '',
    });
  }, [currentProvider]);

  const save = async (event) => {
    event.preventDefault();
    await updateProviderProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-stack">
      <div>
        <p className="eyebrow">Workspace Control</p>
        <h1 className="section-title">Settings</h1>
        <p className="section-copy">Update the current provider profile from the `provider` table and switch the SAMVED theme mode globally.</p>
      </div>

      <div className="panel">
        {saved && <div className="notice-panel">Provider profile saved successfully.</div>}
        <form onSubmit={save} className="form-grid">
          <label className="field">
            <span>Provider Workspace</span>
            <select value={currentProvider.provider_id} onChange={(e) => selectProvider(e.target.value)}>
              {providers.map((provider) => (
                <option key={provider.provider_id} value={provider.provider_id}>
                  {provider.name} ({provider.provider_id})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Laboratory Name</span>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <label className="field">
            <span>Phone Number</span>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>

          <label className="field">
            <span>Ward</span>
            <select value={form.ward_id} onChange={(e) => setForm({ ...form, ward_id: e.target.value ? Number(e.target.value) : '' })}>
              <option value="">Select ward</option>
              {wards.map((ward) => (
                <option key={ward.ward_id} value={ward.ward_id}>
                  Ward {ward.ward_id} - {ward.ward_name || ward.zone || 'Unnamed ward'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>

          <label className="field">
            <span>License</span>
            <input type="text" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
          </label>

          <label className="field field-wide">
            <span>Address</span>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows="3"></textarea>
          </label>

          <div className="field field-wide">
            <span>Theme</span>
            <button type="button" onClick={toggleTheme} className="btn-secondary w-fit">
              <i className={`fa-solid ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
              <span>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</span>
            </button>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-fit">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
