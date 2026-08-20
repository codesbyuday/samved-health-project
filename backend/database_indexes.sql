-- SAMVED Production High-Scale PostgreSQL Database Indexes
-- Justified by query patterns for 200,000-300,000+ active users

-- 1. Appointments Table (Frequent filtering by hospital_id, citizen_id, doctor_id, date, status)
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_id ON public.appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_citizen_id ON public.appointments(citizen_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON public.appointments(created_at DESC);

-- 2. Disease Cases Table (Surveillance filtering by ward, hospital, disease, date)
CREATE INDEX IF NOT EXISTS idx_disease_cases_hospital_id ON public.disease_cases(hospital_id);
CREATE INDEX IF NOT EXISTS idx_disease_cases_citizen_id ON public.disease_cases(citizen_id);
CREATE INDEX IF NOT EXISTS idx_disease_cases_disease_id ON public.disease_cases(disease_id);
CREATE INDEX IF NOT EXISTS idx_disease_cases_report_date ON public.disease_cases(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_disease_cases_status_severity ON public.disease_cases(status, severity);

-- 3. Hospital Medicine Stock Table (Stock monitoring & low stock alerts)
CREATE INDEX IF NOT EXISTS idx_hospital_stock_hospital_id ON public.hospital_medicine_stock(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_stock_medicine_id ON public.hospital_medicine_stock(medicine_id);
CREATE INDEX IF NOT EXISTS idx_hospital_stock_expiry ON public.hospital_medicine_stock(expiry_date);

-- 4. Hospital Staff & Doctors Table (FK & Department lookups)
CREATE INDEX IF NOT EXISTS idx_hospital_staff_hospital_id ON public.hospital_staff(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_staff_user_id ON public.hospital_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON public.doctors(specialization);

-- 5. Citizens Table (Search by phone, aadhar, ward, created_at)
CREATE INDEX IF NOT EXISTS idx_citizens_user_id ON public.citizens(user_id);
CREATE INDEX IF NOT EXISTS idx_citizens_ward_number ON public.citizens(ward_number);
CREATE INDEX IF NOT EXISTS idx_citizens_phone ON public.citizens(phone);

-- 6. Beds Table (Occupancy tracking by hospital and status)
CREATE INDEX IF NOT EXISTS idx_beds_hospital_status ON public.beds(hospital_id, bed_status);
CREATE INDEX IF NOT EXISTS idx_beds_type_status ON public.beds(bed_type, bed_status);

-- 7. Complaints & Alerts Table
CREATE INDEX IF NOT EXISTS idx_complaints_hospital_status ON public.complaints(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_ward_created ON public.alerts(ward_number, created_at DESC);
