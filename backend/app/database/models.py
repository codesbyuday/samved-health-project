from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base


class AuthUser(Base):
    __tablename__ = "auth_users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String, index=True)
    role: Mapped[Optional[str]] = mapped_column(String, default="citizen")
    password_hash: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Citizen(Base):
    __tablename__ = "citizens"

    citizen_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("auth_users.id"), nullable=True)
    guardian_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String, index=True)
    gender: Mapped[Optional[str]] = mapped_column(String)
    phone: Mapped[Optional[str]] = mapped_column(String, index=True)
    address: Mapped[Optional[str]] = mapped_column(Text)
    ward_number: Mapped[Optional[int]] = mapped_column(Integer, index=True)
    aadhar_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True)
    blood_group: Mapped[Optional[str]] = mapped_column(String)
    user_photo_url: Mapped[Optional[str]] = mapped_column(String)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String, index=True)
    type: Mapped[Optional[str]] = mapped_column(String)
    address: Mapped[Optional[str]] = mapped_column(Text)
    ward_id: Mapped[Optional[int]] = mapped_column(Integer, index=True)
    contact_number: Mapped[Optional[str]] = mapped_column(String)
    email: Mapped[Optional[str]] = mapped_column(String)
    verified_by_smc: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HospitalStaff(Base):
    __tablename__ = "hospital_staff"

    staff_uuid: Mapped[str] = mapped_column(String, primary_key=True)
    staff_id: Mapped[Optional[str]] = mapped_column(String, index=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("auth_users.id"))
    name: Mapped[Optional[str]] = mapped_column(String)
    role: Mapped[Optional[str]] = mapped_column(String)
    designation: Mapped[Optional[str]] = mapped_column(String)
    department: Mapped[Optional[str]] = mapped_column(String)
    phone: Mapped[Optional[str]] = mapped_column(String)
    address: Mapped[Optional[str]] = mapped_column(Text)
    shift: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[Optional[str]] = mapped_column(String)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Doctor(Base):
    __tablename__ = "doctors"

    staff_uuid: Mapped[str] = mapped_column(String, ForeignKey("hospital_staff.staff_uuid"), primary_key=True)
    specialization: Mapped[Optional[str]] = mapped_column(String)
    consultation_time: Mapped[Optional[int]] = mapped_column(Integer)
    work_start_time: Mapped[Optional[str]] = mapped_column(String)
    work_end_time: Mapped[Optional[str]] = mapped_column(String)
    break_start_time: Mapped[Optional[str]] = mapped_column(String)
    break_end_time: Mapped[Optional[str]] = mapped_column(String)
    max_patients_per_day: Mapped[Optional[int]] = mapped_column(Integer)


class HospitalWard(Base):
    __tablename__ = "hospital_wards"

    hospital_ward_id: Mapped[str] = mapped_column(String, primary_key=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    ward_name: Mapped[Optional[str]] = mapped_column(String)
    ward_description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Bed(Base):
    __tablename__ = "beds"

    bed_id: Mapped[str] = mapped_column(String, primary_key=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    assigned_to: Mapped[Optional[str]] = mapped_column(String, ForeignKey("citizens.citizen_id"))
    located_at: Mapped[Optional[str]] = mapped_column(String)
    bed_type: Mapped[Optional[str]] = mapped_column(String)
    bed_status: Mapped[Optional[str]] = mapped_column(String)
    last_updated_on: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MedicalEquipment(Base):
    __tablename__ = "medical_equipment"

    equipment_uuid: Mapped[str] = mapped_column(String, primary_key=True)
    equipment_id: Mapped[Optional[str]] = mapped_column(String)
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    equipment_name: Mapped[Optional[str]] = mapped_column(String)
    equipment_category: Mapped[Optional[str]] = mapped_column(String)
    condition_status: Mapped[Optional[str]] = mapped_column(String)
    last_serviced_date: Mapped[Optional[date]] = mapped_column(Date)
    added_date: Mapped[Optional[date]] = mapped_column(Date)
    manufacturer: Mapped[Optional[str]] = mapped_column(String)
    model_number: Mapped[Optional[str]] = mapped_column(String)
    equipment_location: Mapped[Optional[str]] = mapped_column(String)


class Ambulance(Base):
    __tablename__ = "ambulances"

    ambulance_vehicle_number: Mapped[str] = mapped_column(String, primary_key=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    status: Mapped[Optional[str]] = mapped_column(String)
    current_location: Mapped[Optional[str]] = mapped_column(String)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Disease(Base):
    __tablename__ = "diseases"

    disease_id: Mapped[str] = mapped_column(String, primary_key=True)
    disease_name: Mapped[Optional[str]] = mapped_column(String, index=True)
    disease_type: Mapped[Optional[str]] = mapped_column(String)
    disease_category: Mapped[Optional[str]] = mapped_column(String)
    is_notifiable: Mapped[Optional[bool]] = mapped_column(Boolean, default=True)


class DiseaseCase(Base):
    __tablename__ = "disease_cases"

    case_id: Mapped[str] = mapped_column(String, primary_key=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    citizen_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("citizens.citizen_id"))
    ward_number: Mapped[Optional[int]] = mapped_column(Integer, index=True)
    disease_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("diseases.disease_id"))
    report_date: Mapped[Optional[date]] = mapped_column(Date)
    severity: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[Optional[str]] = mapped_column(String)
    reported_by: Mapped[Optional[str]] = mapped_column(String)


class Medicine(Base):
    __tablename__ = "medicines"

    medicine_id: Mapped[str] = mapped_column(String, primary_key=True)
    medicine_name: Mapped[Optional[str]] = mapped_column(String, index=True)
    medicine_category: Mapped[Optional[str]] = mapped_column(String)
    manufacturer_name: Mapped[Optional[str]] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text)


class HospitalMedicineStock(Base):
    __tablename__ = "hospital_medicine_stock"

    stock_id: Mapped[str] = mapped_column(String, primary_key=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    medicine_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("medicines.medicine_id"))
    quantity: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    threshold: Mapped[Optional[int]] = mapped_column(Integer, default=10)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date)
    last_updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DiagnosticReport(Base):
    __tablename__ = "diagnostic_reports"

    report_id: Mapped[str] = mapped_column(String, primary_key=True)
    citizen_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("citizens.citizen_id"))
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    provider_id: Mapped[Optional[str]] = mapped_column(String)
    test_type_id: Mapped[Optional[int]] = mapped_column(Integer)
    result: Mapped[Optional[str]] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    report_file_url: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[Optional[str]] = mapped_column(String)
    test_date: Mapped[Optional[date]] = mapped_column(Date)
    uploaded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TestType(Base):
    __tablename__ = "test_types"

    test_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_name: Mapped[Optional[str]] = mapped_column(String)
    test_category: Mapped[Optional[str]] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text)


class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id: Mapped[str] = mapped_column(String, primary_key=True)
    citizen_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("citizens.citizen_id"))
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    hospital_ward_id: Mapped[Optional[str]] = mapped_column(String)
    doctor_id: Mapped[Optional[str]] = mapped_column(String)
    appointment_type: Mapped[Optional[str]] = mapped_column(String)
    appointment_date: Mapped[Optional[date]] = mapped_column(Date)
    time_slot: Mapped[Optional[str]] = mapped_column(String)
    token_id: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id: Mapped[str] = mapped_column(String, primary_key=True)
    citizen_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("citizens.citizen_id"))
    hospital_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("hospitals.hospital_id"))
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String)
    priority: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[Optional[str]] = mapped_column(String)
    remarks_by_officers: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class Ward(Base):
    __tablename__ = "wards"

    ward_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ward_name: Mapped[Optional[str]] = mapped_column(String)
    zone: Mapped[Optional[str]] = mapped_column(String)
    population: Mapped[Optional[int]] = mapped_column(Integer)
    population_density: Mapped[Optional[float]] = mapped_column(Float)


class Alert(Base):
    __tablename__ = "alerts"

    alert_id: Mapped[str] = mapped_column(String, primary_key=True)
    alert_type: Mapped[Optional[str]] = mapped_column(String)
    ward_number: Mapped[Optional[int]] = mapped_column(Integer)
    severity: Mapped[Optional[str]] = mapped_column(String)
    message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    recipient_type: Mapped[Optional[str]] = mapped_column(String)
    recipient_id: Mapped[Optional[str]] = mapped_column(String)
    title: Mapped[Optional[str]] = mapped_column(String)
    message: Mapped[Optional[str]] = mapped_column(Text)
    type: Mapped[Optional[str]] = mapped_column(String)
    is_read: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class VaccinationCampaign(Base):
    __tablename__ = "vaccination_campaigns"

    campaign_id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String)
    target_ward: Mapped[Optional[int]] = mapped_column(Integer)
    vaccine_name: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[Optional[str]] = mapped_column(String)
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    target_count: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SMCOfficial(Base):
    __tablename__ = "smc_officials"

    official_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("auth_users.id"))
    name: Mapped[Optional[str]] = mapped_column(String)
    designation: Mapped[Optional[str]] = mapped_column(String)
    role: Mapped[Optional[str]] = mapped_column(String)


class ResourceAllocationTask(Base):
    __tablename__ = "resource_allocation_tasks"

    task_id: Mapped[str] = mapped_column(String, primary_key=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String)
    quantity: Mapped[Optional[int]] = mapped_column(Integer)
    hospital_id: Mapped[Optional[str]] = mapped_column(String)
    ward_number: Mapped[Optional[int]] = mapped_column(Integer)
    assigned_officer_id: Mapped[Optional[str]] = mapped_column(String)
    assigned_officer_name: Mapped[Optional[str]] = mapped_column(String)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
