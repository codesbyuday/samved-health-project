// -- WARNING: This schema is for context only and is not meant to be run.
// -- Table order and constraints may not be valid for execution.

// CREATE TABLE public.auth_users (
//   email text UNIQUE,
//   phone text,
//   role USER-DEFINED,
//   password_hash text,
//   id uuid NOT NULL DEFAULT gen_random_uuid(),
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT auth_users_pkey PRIMARY KEY (id)
// );
// CREATE TABLE public.wards (
//   ward_id integer NOT NULL,
//   ward_name text,
//   zone text,
//   population integer,
//   population_density double precision,
//   CONSTRAINT wards_pkey PRIMARY KEY (ward_id)
// );
// CREATE TABLE public.provider (
//   provider_id text NOT NULL,
//   user_id uuid,
//   ward_id integer,
//   name text,
//   role USER-DEFINED,
//   address text,
//   email text,
//   phone text,
//   license text,
//   created_at timestamp without time zone DEFAULT now(),
//   location USER-DEFINED,
//   CONSTRAINT provider_pkey PRIMARY KEY (provider_id),
//   CONSTRAINT provider_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id),
//   CONSTRAINT provider_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES public.wards(ward_id)
// );
// CREATE TABLE public.test_types (
//   test_name text,
//   test_category text,
//   description text,
//   test_id integer NOT NULL DEFAULT nextval('test_type_seq'::regclass),
//   CONSTRAINT test_types_pkey PRIMARY KEY (test_id)
// );
// CREATE TABLE public.lab_tests (
//   provider_id text,
//   test_type_id integer,
//   price integer,
//   lab_test_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   CONSTRAINT lab_tests_pkey PRIMARY KEY (lab_test_id),
//   CONSTRAINT lab_tests_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider(provider_id),
//   CONSTRAINT lab_tests_test_type_id_fkey FOREIGN KEY (test_type_id) REFERENCES public.test_types(test_id)
// );
// CREATE TABLE public.citizens (
//   date_of_birth date NOT NULL,
//   blood_group USER-DEFINED,
//   user_id uuid,
//   guardian_id text,
//   name text,
//   gender USER-DEFINED,
//   phone text,
//   address text,
//   ward_number integer,
//   citizen_id text NOT NULL DEFAULT generate_citizen_id(),
//   created_at timestamp without time zone DEFAULT now(),
//   user_photo_url text,
//   aadhar_id character varying UNIQUE,
//   CONSTRAINT citizens_pkey PRIMARY KEY (citizen_id),
//   CONSTRAINT citizens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id),
//   CONSTRAINT citizens_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT citizens_ward_number_fkey FOREIGN KEY (ward_number) REFERENCES public.wards(ward_id)
// );
// CREATE TABLE public.smc_officials (
//   official_id text NOT NULL,
//   user_id uuid,
//   name text,
//   designation text,
//   phone text,
//   role text,
//   status USER-DEFINED,
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT smc_officials_pkey PRIMARY KEY (official_id),
//   CONSTRAINT smc_officials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id)
// );
// CREATE TABLE public.hospitals (
//   hospital_id text NOT NULL,
//   name text,
//   type text,
//   address text,
//   ward_id integer,
//   contact_number text,
//   email text,
//   verified_by_smc boolean,
//   created_at timestamp without time zone DEFAULT now(),
//   location USER-DEFINED,
//   CONSTRAINT hospitals_pkey PRIMARY KEY (hospital_id),
//   CONSTRAINT hospitals_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES public.wards(ward_id)
// );
// CREATE TABLE public.hospital_staff (
//   staff_id text,
//   hospital_id text,
//   user_id uuid,
//   name text,
//   role USER-DEFINED,
//   designation text,
//   department text,
//   phone text,
//   address text,
//   shift USER-DEFINED,
//   status USER-DEFINED,
//   staff_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
//   joined_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT hospital_staff_pkey PRIMARY KEY (staff_uuid),
//   CONSTRAINT hospital_staff_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT hospital_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id)
// );
// CREATE TABLE public.doctors (
//   staff_uuid uuid NOT NULL,
//   specialization USER-DEFINED,
//   consultation_time integer,
//   work_start_time time without time zone,
//   work_end_time time without time zone,
//   break_start_time time without time zone,
//   break_end_time time without time zone,
//   max_patients_per_day integer,
//   CONSTRAINT doctors_pkey PRIMARY KEY (staff_uuid),
//   CONSTRAINT doctors_staff_uuid_fkey FOREIGN KEY (staff_uuid) REFERENCES public.hospital_staff(staff_uuid)
// );
// CREATE TABLE public.ambulances (
//   hospital_id text,
//   status USER-DEFINED,
//   current_location text,
//   updated_at timestamp without time zone,
//   ambulance_vehicle_number text NOT NULL,
//   added_by uuid,
//   updated_by uuid,
//   CONSTRAINT ambulances_pkey PRIMARY KEY (ambulance_vehicle_number),
//   CONSTRAINT ambulances_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT ambulances_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.hospital_staff(staff_uuid),
//   CONSTRAINT ambulances_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.hospital_staff(staff_uuid)
// );
// CREATE TABLE public.medical_equipment (
//   equipment_uuid text NOT NULL,
//   equipment_id text,
//   hospital_id text,
//   equipment_name text,
//   equipment_category text,
//   condition_status USER-DEFINED,
//   last_serviced_date date,
//   added_date date,
//   manufacturer text,
//   model_number text,
//   equipment_location text,
//   added_by uuid,
//   updated_by uuid,
//   CONSTRAINT medical_equipment_pkey PRIMARY KEY (equipment_uuid),
//   CONSTRAINT medical_equipment_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT fk_equipment_added_by FOREIGN KEY (added_by) REFERENCES public.hospital_staff(staff_uuid),
//   CONSTRAINT fk_equipment_updated_by FOREIGN KEY (updated_by) REFERENCES public.hospital_staff(staff_uuid)
// );
// CREATE TABLE public.medicines (
//   medicine_id text NOT NULL,
//   medicine_name text,
//   medicine_category text,
//   manufacturer_name text,
//   description text,
//   CONSTRAINT medicines_pkey PRIMARY KEY (medicine_id)
// );
// CREATE TABLE public.hospital_medicine_stock (
//   hospital_id text,
//   medicine_id text,
//   quantity integer,
//   threshold integer,
//   expiry_date date,
//   last_updated timestamp without time zone,
//   stock_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   added_by uuid,
//   updated_by uuid,
//   CONSTRAINT hospital_medicine_stock_pkey PRIMARY KEY (stock_id),
//   CONSTRAINT hospital_medicine_stock_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT hospital_medicine_stock_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id),
//   CONSTRAINT hospital_medicine_stock_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.hospital_staff(staff_uuid),
//   CONSTRAINT hospital_medicine_stock_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.hospital_staff(staff_uuid)
// );
// CREATE TABLE public.pharmacy_medicine_stock (
//   provider_id text,
//   medicine_id text,
//   quantity integer,
//   threshold integer,
//   expiry_date date,
//   last_updated timestamp without time zone,
//   stock_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   CONSTRAINT pharmacy_medicine_stock_pkey PRIMARY KEY (stock_id),
//   CONSTRAINT pharmacy_medicine_stock_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider(provider_id),
//   CONSTRAINT pharmacy_medicine_stock_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id)
// );
// CREATE TABLE public.hospital_wards (
//   hospital_id text,
//   ward_name text,
//   ward_description text,
//   status USER-DEFINED,
//   hospital_ward_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT hospital_wards_pkey PRIMARY KEY (hospital_ward_id),
//   CONSTRAINT hospital_wards_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id)
// );
// CREATE TABLE public.beds (
//   bed_id text NOT NULL,
//   hospital_id text,
//   assigned_to text,
//   located_at uuid,
//   bed_type USER-DEFINED,
//   bed_status USER-DEFINED,
//   last_updated_on timestamp without time zone,
//   CONSTRAINT beds_pkey PRIMARY KEY (bed_id),
//   CONSTRAINT beds_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT beds_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT beds_located_at_fkey FOREIGN KEY (located_at) REFERENCES public.hospital_wards(hospital_ward_id)
// );
// CREATE TABLE public.appointments (
//   citizen_id text,
//   hospital_id text,
//   hospital_ward_id uuid,
//   doctor_id uuid,
//   appointment_type USER-DEFINED,
//   appointment_date date,
//   time_slot text,
//   token_id integer,
//   status USER-DEFINED,
//   appointment_id text NOT NULL DEFAULT generate_appointment_id(),
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id),
//   CONSTRAINT appointments_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT appointments_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT appointments_hospital_ward_id_fkey FOREIGN KEY (hospital_ward_id) REFERENCES public.hospital_wards(hospital_ward_id),
//   CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(staff_uuid)
// );
// CREATE TABLE public.telemedicine_sessions (
//   appointment_id text,
//   doctor_id uuid,
//   citizen_id text,
//   session_type USER-DEFINED,
//   meeting_link text,
//   session_status USER-DEFINED,
//   scheduled_at timestamp without time zone,
//   started_at timestamp without time zone,
//   ended_at timestamp without time zone,
//   session_notes text,
//   session_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT telemedicine_sessions_pkey PRIMARY KEY (session_id),
//   CONSTRAINT telemedicine_sessions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id),
//   CONSTRAINT telemedicine_sessions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(staff_uuid),
//   CONSTRAINT telemedicine_sessions_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.citizens(citizen_id)
// );
// CREATE TABLE public.referrals (
//   status USER-DEFINED DEFAULT 'pending'::referral_status_enum,
//   urgency_level USER-DEFINED NOT NULL,
//   citizen_id text,
//   referring_doctor_id uuid,
//   from_hospital_id text,
//   to_hospital_id text,
//   to_doctor_id uuid,
//   referral_reason text,
//   referral_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   created_at timestamp without time zone DEFAULT now(),
//   notes text,
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT referrals_pkey PRIMARY KEY (referral_id),
//   CONSTRAINT referrals_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT referrals_from_hospital_id_fkey FOREIGN KEY (from_hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT referrals_to_hospital_id_fkey FOREIGN KEY (to_hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT referrals_to_doctor_id_fkey FOREIGN KEY (to_doctor_id) REFERENCES public.doctors(staff_uuid),
//   CONSTRAINT referrals_referring_doctor_id_fkey FOREIGN KEY (referring_doctor_id) REFERENCES public.hospital_staff(staff_uuid)
// );
// CREATE TABLE public.health_records (
//   citizen_id text NOT NULL,
//   hospital_id text,
//   staff_id uuid,
//   diagnosis text,
//   prescription text,
//   notes text,
//   visit_date date,
//   record_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   CONSTRAINT health_records_pkey PRIMARY KEY (record_id),
//   CONSTRAINT health_records_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT health_records_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT health_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.hospital_staff(staff_uuid)
// );
// CREATE TABLE public.diagnostic_reports (
//   citizen_id text,
//   hospital_id text,
//   provider_id text,
//   test_type_id integer,
//   result text,
//   description text,
//   report_file_url text,
//   status USER-DEFINED,
//   test_date date,
//   uploaded_at timestamp without time zone,
//   report_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   CONSTRAINT diagnostic_reports_pkey PRIMARY KEY (report_id),
//   CONSTRAINT diagnostic_reports_test_type_id_fkey FOREIGN KEY (test_type_id) REFERENCES public.test_types(test_id),
//   CONSTRAINT diagnostic_reports_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT diagnostic_reports_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT diagnostic_reports_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider(provider_id)
// );
// CREATE TABLE public.vaccination_campaigns (
//   name text,
//   vaccine_type text,
//   ward_id integer,
//   date date,
//   target_population text,
//   status USER-DEFINED,
//   campaign_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   CONSTRAINT vaccination_campaigns_pkey PRIMARY KEY (campaign_id),
//   CONSTRAINT vaccination_campaigns_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES public.wards(ward_id)
// );
// CREATE TABLE public.vaccination_records (
//   date_administered date DEFAULT now(),
//   citizen_id text,
//   hospital_id text,
//   campaign_id uuid,
//   vaccine_type text,
//   dose_number integer,
//   record_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   CONSTRAINT vaccination_records_pkey PRIMARY KEY (record_id),
//   CONSTRAINT vaccination_records_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT vaccination_records_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT vaccination_records_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.vaccination_campaigns(campaign_id)
// );
// CREATE TABLE public.diseases (
//   disease_name text,
//   disease_type text,
//   disease_category USER-DEFINED,
//   is_notifiable boolean,
//   disease_id text NOT NULL DEFAULT generate_disease_id(),
//   CONSTRAINT diseases_pkey PRIMARY KEY (disease_id)
// );
// CREATE TABLE public.disease_cases (
//   hospital_id text,
//   citizen_id text,
//   disease_id text,
//   report_date date,
//   severity USER-DEFINED,
//   status USER-DEFINED,
//   case_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   reported_by uuid,
//   updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
//   health_record_id uuid,
//   CONSTRAINT disease_cases_pkey PRIMARY KEY (case_id),
//   CONSTRAINT disease_cases_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id),
//   CONSTRAINT disease_cases_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT disease_cases_disease_id_fkey FOREIGN KEY (disease_id) REFERENCES public.diseases(disease_id),
//   CONSTRAINT fk_reported_by_staff FOREIGN KEY (reported_by) REFERENCES public.hospital_staff(staff_uuid),
//   CONSTRAINT disease_cases_health_record_id_fkey FOREIGN KEY (health_record_id) REFERENCES public.health_records(record_id)
// );
// CREATE TABLE public.health_indicator_data (
//   ward_number integer,
//   total_doctors integer,
//   total_nurses integer,
//   total_beds integer,
//   available_beds integer,
//   vaccinated_people integer,
//   eligible_population integer,
//   positive_tests integer,
//   total_tests integer,
//   confirmed_cases integer,
//   deaths integer,
//   recorded_at timestamp without time zone DEFAULT now(),
//   cases_this_week integer,
//   cases_last_week integer,
//   active_cases integer,
//   indicator_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   CONSTRAINT health_indicator_data_pkey PRIMARY KEY (indicator_id),
//   CONSTRAINT health_indicator_data_ward_number_fkey FOREIGN KEY (ward_number) REFERENCES public.wards(ward_id)
// );
// CREATE TABLE public.health_index_results (
//   ward_number integer UNIQUE,
//   zone_risk_score double precision,
//   health_index double precision,
//   risk_level USER-DEFINED,
//   index_id text NOT NULL DEFAULT generate_index_id(),
//   calculated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT health_index_results_pkey PRIMARY KEY (index_id),
//   CONSTRAINT health_index_results_ward_number_fkey FOREIGN KEY (ward_number) REFERENCES public.wards(ward_id)
// );
// CREATE TABLE public.complaints (
//   citizen_id text,
//   hospital_id text,
//   description text,
//   priority USER-DEFINED,
//   status USER-DEFINED,
//   remarks_by_officers text,
//   resolved_at timestamp without time zone,
//   complaint_id text NOT NULL DEFAULT generate_complaint_id(),
//   created_at timestamp without time zone DEFAULT now(),
//   category USER-DEFINED,
//   CONSTRAINT complaints_pkey PRIMARY KEY (complaint_id),
//   CONSTRAINT complaints_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.citizens(citizen_id),
//   CONSTRAINT complaints_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id)
// );
// CREATE TABLE public.alerts (
//   ward_number integer,
//   alert_type text CHECK (alert_type = ANY (ARRAY['Vaccination Campaign'::text, 'Health Advisory'::text, 'Vaccination Drive'::text, 'Hot Alerts'::text])),
//   message text,
//   severity text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
//   created_by text,
//   alert_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT alerts_pkey PRIMARY KEY (alert_id),
//   CONSTRAINT alerts_ward_number_fkey FOREIGN KEY (ward_number) REFERENCES public.wards(ward_id)
// );
// CREATE TABLE public.notifications (
//   title text,
//   message text,
//   type USER-DEFINED,
//   priority USER-DEFINED,
//   target_type USER-DEFINED,
//   target_user_id uuid,
//   target_ward_number integer,
//   target_hospital_id text,
//   related_entity text,
//   related_entity_id uuid,
//   created_by uuid,
//   notification_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   created_at timestamp without time zone DEFAULT now(),
//   target_role USER-DEFINED,
//   CONSTRAINT notifications_pkey PRIMARY KEY (notification_id),
//   CONSTRAINT notifications_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.auth_users(id),
//   CONSTRAINT notifications_target_ward_number_fkey FOREIGN KEY (target_ward_number) REFERENCES public.wards(ward_id),
//   CONSTRAINT notifications_target_hospital_id_fkey FOREIGN KEY (target_hospital_id) REFERENCES public.hospitals(hospital_id)
// );
// CREATE TABLE public.outbreak_signals (
//   ward_number integer,
//   disease_id text,
//   disease_name text,
//   risk_level text NOT NULL,
//   ai_summary text,
//   signal_id uuid NOT NULL DEFAULT gen_random_uuid(),
//   current_week_cases integer NOT NULL DEFAULT 0,
//   previous_week_cases integer NOT NULL DEFAULT 0,
//   active_cases integer NOT NULL DEFAULT 0,
//   severe_cases integer NOT NULL DEFAULT 0,
//   positivity_rate double precision NOT NULL DEFAULT 0,
//   health_index double precision NOT NULL DEFAULT 0,
//   outbreak_score double precision NOT NULL DEFAULT 0,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT outbreak_signals_pkey PRIMARY KEY (signal_id),
//   CONSTRAINT outbreak_signals_ward_number_fkey FOREIGN KEY (ward_number) REFERENCES public.wards(ward_id),
//   CONSTRAINT outbreak_signals_disease_id_fkey FOREIGN KEY (disease_id) REFERENCES public.diseases(disease_id)
// );