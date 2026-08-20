// Mock Data simulating Supabase Tables

export const auth_users = [
    { id: 'u1', email: 'pharmacy@health.gov', password: 'password123', provider_id: 'p1' }
  ];
  
  export const provider = [
    { 
      provider_id: 'p1', 
      name: 'City Central Pharmacy', 
      role: 'pharmacy', 
      ward: 'Ward 12', 
      license: 'PHR-2026-884', 
      phone: '555-0199', 
      address: '123 Health St, Medical District',
      operating_hours: 'Mon-Sat: 08:00 - 20:00'
    }
  ];
  
  export const medicines = [
    { medicine_id: 'm1', name: 'Paracetamol 500mg', category: 'Pain Relief', description: 'Tablet' },
    { medicine_id: 'm2', name: 'Amoxicillin 250mg', category: 'Antibiotic', description: 'Capsule' },
    { medicine_id: 'm3', name: 'Insulin Glargine', category: 'Antidiabetic', description: 'Injection' },
    { medicine_id: 'm4', name: 'Cetirizine 10mg', category: 'Antihistamine', description: 'Tablet' },
    { medicine_id: 'm5', name: 'Omeprazole 20mg', category: 'Gastric', description: 'Capsule' },
    { medicine_id: 'm6', name: 'Metformin 500mg', category: 'Antidiabetic', description: 'Tablet' },
  ];
  
  export const pharmacy_medicine_stock = [
    { stock_id: 's1', provider_id: 'p1', medicine_id: 'm1', quantity: 150, threshold: 20, expiry_date: '2027-06-15', last_updated: '2026-03-10 10:00:00' },
    { stock_id: 's2', provider_id: 'p1', medicine_id: 'm2', quantity: 5, threshold: 15, expiry_date: '2026-05-20', last_updated: '2026-03-09 14:30:00' },
    { stock_id: 's3', provider_id: 'p1', medicine_id: 'm3', quantity: 0, threshold: 5, expiry_date: '2026-08-10', last_updated: '2026-03-10 09:00:00' },
    { stock_id: 's4', provider_id: 'p1', medicine_id: 'm4', quantity: 200, threshold: 30, expiry_date: '2028-01-01', last_updated: '2026-03-01 08:00:00' },
    { stock_id: 's5', provider_id: 'p1', medicine_id: 'm5', quantity: 12, threshold: 20, expiry_date: '2026-04-15', last_updated: '2026-03-08 12:00:00' },
    { stock_id: 's6', provider_id: 'p1', medicine_id: 'm6', quantity: 50, threshold: 10, expiry_date: '2027-12-31', last_updated: '2026-03-05 16:00:00' },
  ];
  
  export const health_records = [
    { record_id: 'hr1', citizen_id: 'citizen_1', staff_id: 'doc_5', diagnosis: 'Seasonal Flu', prescription: 'Paracetamol 500mg x 2 days', visit_date: '2026-03-10', verified: false },
    { record_id: 'hr2', citizen_id: 'citizen_2', staff_id: 'doc_3', diagnosis: 'Bacterial Infection', prescription: 'Amoxicillin 250mg x 5 days', visit_date: '2026-03-09', verified: true },
    { record_id: 'hr3', citizen_id: 'citizen_3', staff_id: 'doc_5', diagnosis: 'Allergies', prescription: 'Cetirizine 10mg x 10 days', visit_date: '2026-03-10', verified: false },
  ];
  
  export const alerts = [
    { alert_id: 'a1', type: 'Outbreak', ward: 'Ward 12', severity: 'High', message: 'Influenza type A outbreak detected.', date: '2026-03-10' },
    { alert_id: 'a2', type: 'Shortage', ward: 'All', severity: 'Medium', message: 'Insulin supplies running low regionally.', date: '2026-03-09' },
  ];
  
  export const notifications = [
    { id: 'n1', type: 'Order', message: 'New order request #ORD-301', read: false },
    { id: 'n2', type: 'Stock', message: 'Amoxicillin is below threshold', read: false },
  ];
  
  // Simulated non-persisted state for Orders
  export const initialOrders = [
    { order_id: 'ORD-301', citizen_id: 'citizen_4', medicine_id: 'm1', quantity: 10, order_time: '2026-03-10 08:30', status: 'Pending' },
    { order_id: 'ORD-302', citizen_id: 'citizen_5', medicine_id: 'm3', quantity: 2, order_time: '2026-03-09 14:00', status: 'Accepted' },
  ];