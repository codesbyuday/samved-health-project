import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const Settings = () => {
  const { pharmacyProfile, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { databaseMode } = useData();
  const [formData, setFormData] = useState(pharmacyProfile);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setFormData(pharmacyProfile);
  }, [pharmacyProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await updateProfile(formData);
    setNotice(result.success ? 'Settings updated successfully.' : result.error);
  };

  if (!formData) return <div className="surface-card rounded-3xl p-6 text-soft">Loading profile...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Pharmacy Settings</h1>
        <p className="page-subtitle">Profile details, theme preference, and current data connection mode.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="surface-card rounded-[1.75rem] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">Pharmacy Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-shell" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">Ward</label>
                <input type="text" name="ward" value={formData.ward} disabled className="input-shell opacity-70" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-shell" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-soft">License Number</label>
                <input type="text" name="license" value={formData.license} disabled className="input-shell opacity-70" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-soft">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-shell" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-soft">Operating Hours</label>
                <input
                  type="text"
                  name="operating_hours"
                  value={formData.operating_hours}
                  onChange={handleChange}
                  className="input-shell"
                />
              </div>
            </div>

            {notice && <p className="text-sm text-soft">{notice}</p>}

            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="surface-card rounded-[1.75rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">Theme</p>
            <h3 className="mt-2 text-xl font-bold text-main">{theme === 'dark' ? 'Night mode' : 'Day mode'}</h3>
            <p className="mt-2 text-sm text-soft">Use the toggle to match your working environment.</p>
            <button type="button" onClick={toggleTheme} className="btn-secondary mt-4 w-full">
              Toggle Theme
            </button>
          </div>

          <div className="surface-card rounded-[1.75rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">Database</p>
            <h3 className="mt-2 text-xl font-bold text-main">{databaseMode}</h3>
            <p className="mt-2 text-sm text-soft">
              Supabase mode becomes active automatically when the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
              values are present.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
