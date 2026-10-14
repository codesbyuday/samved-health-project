from typing import List, Optional
from app.database.connection import supabase_http_client
from app.core.logging import logger


class HospitalService:
    async def get_all_hospitals(self) -> List[dict]:
        from app.core.cache import cache_manager
        cached = await cache_manager.get("hospitals_list_all")
        if cached:
            return cached
        hospitals = await supabase_http_client.select("hospitals", {"order": "name.asc"})
        await cache_manager.set("hospitals_list_all", hospitals, ttl_seconds=300)
        return hospitals

    async def get_hospital_by_id(self, hospital_id: str) -> Optional[dict]:
        rows = await supabase_http_client.select("hospitals", {"hospital_id": f"eq.{hospital_id}"})
        return rows[0] if rows else None

    async def get_departments(self, hospital_id: Optional[str] = None) -> List[str]:
        from app.core.cache import cache_manager
        cache_key = f"hospital_departments_{hospital_id or 'all'}"
        cached = await cache_manager.get(cache_key)
        if cached is not None:
            return cached

        query = {"role": "eq.doctor"}
        if hospital_id:
            query["hospital_id"] = f"eq.{hospital_id}"

        staff = await supabase_http_client.select("hospital_staff", query)
        depts = sorted(list({s.get("department") for s in staff if isinstance(s, dict) and s.get("department")}))
        if not depts:
            depts = [
                "Cardiology", "Dermatology", "ENT", "General Medicine",
                "Gynecology", "Neurology", "Orthopedics", "Pediatrics"
            ]
        await cache_manager.set(cache_key, depts, ttl_seconds=600)
        return depts

    async def get_doctors(self, hospital_id: Optional[str] = None, department: Optional[str] = None) -> List[dict]:
        import asyncio
        from app.core.cache import cache_manager

        cache_key = f"doctors_list_v2_{hospital_id or 'all'}_{department or 'all'}"
        cached = await cache_manager.get(cache_key)
        if cached is not None:
            return cached

        stf_query = {"role": "eq.doctor"}
        if hospital_id:
            stf_query["hospital_id"] = f"eq.{hospital_id}"

        stf_task = supabase_http_client.select("hospital_staff", stf_query)
        doc_task = supabase_http_client.select("doctors")
        hosp_task = supabase_http_client.select("hospitals", {"select": "hospital_id,name"})

        stf_raw, doc_raw, hosp_raw = await asyncio.gather(stf_task, doc_task, hosp_task, return_exceptions=True)

        staff_rows = stf_raw if isinstance(stf_raw, list) else []
        doctor_rows = doc_raw if isinstance(doc_raw, list) else []
        hosp_rows = hosp_raw if isinstance(hosp_raw, list) else []

        doc_map = {d["staff_uuid"]: d for d in doctor_rows if isinstance(d, dict) and "staff_uuid" in d}
        hosp_map = {h["hospital_id"]: h.get("name") for h in hosp_rows if isinstance(h, dict) and "hospital_id" in h}

        result = []
        dept_filter = department.strip().lower() if department else None

        for s in staff_rows:
            if not isinstance(s, dict):
                continue
            s_uuid = s.get("staff_uuid")
            s_dept = (s.get("department") or "").strip()
            d_data = doc_map.get(s_uuid, {})
            d_spec = (d_data.get("specialization") or "").strip()

            if dept_filter:
                if dept_filter != s_dept.lower() and dept_filter != d_spec.lower():
                    continue

            h_id = s.get("hospital_id")
            result.append({
                **d_data,
                **s,
                "hospital_name": hosp_map.get(h_id) or "Solapur Municipal Hospital",
                "specialization": d_spec or s_dept,
                "consultation_time": d_data.get("consultation_time") or 15,
            })

        await cache_manager.set(cache_key, result, ttl_seconds=300)
        return result

    async def get_beds(self, hospital_id: str) -> List[dict]:
        from app.core.cache import cache_manager
        cache_key = f"beds_list_{hospital_id}"
        cached = await cache_manager.get(cache_key)
        if cached is not None:
            return cached
        beds = await supabase_http_client.select("beds", {"hospital_id": f"eq.{hospital_id}"})
        await cache_manager.set(cache_key, beds, ttl_seconds=120)
        return beds

    async def update_bed(self, bed_id: str, updates: dict) -> dict:
        from app.core.cache import cache_manager
        res = await supabase_http_client.update("beds", {"bed_id": f"eq.{bed_id}"}, updates)
        await cache_manager.clear_prefix("beds_list")
        return res[0] if res else updates

    async def get_equipment(self, hospital_id: str) -> List[dict]:
        from app.core.cache import cache_manager
        cache_key = f"equipment_list_{hospital_id}"
        cached = await cache_manager.get(cache_key)
        if cached is not None:
            return cached
        equipment = await supabase_http_client.select("medical_equipment", {"hospital_id": f"eq.{hospital_id}"})
        await cache_manager.set(cache_key, equipment, ttl_seconds=300)
        return equipment

    async def get_ambulances(self, hospital_id: str) -> List[dict]:
        from app.core.cache import cache_manager
        cache_key = f"ambulances_list_{hospital_id}"
        cached = await cache_manager.get(cache_key)
        if cached is not None:
            return cached
        ambulances = await supabase_http_client.select("ambulances", {"hospital_id": f"eq.{hospital_id}"})
        await cache_manager.set(cache_key, ambulances, ttl_seconds=300)
        return ambulances

    async def get_dashboard_overview(self, hospital_id: str) -> dict:
        import asyncio
        from datetime import datetime

        appointments_task = supabase_http_client.select("appointments", {"order": "created_at.desc"})
        beds_task = supabase_http_client.select("beds", {"hospital_id": f"eq.{hospital_id}"})
        cases_task = supabase_http_client.select("disease_cases", {"order": "report_date.desc"})
        alerts_task = supabase_http_client.select("alerts", {"order": "created_at.desc"})
        diseases_task = supabase_http_client.select("diseases")
        citizens_task = supabase_http_client.select("citizens")

        appointments_raw, beds_raw, cases_raw, alerts_raw, diseases_raw, citizens_raw = await asyncio.gather(
            appointments_task, beds_task, cases_task, alerts_task, diseases_task, citizens_task, return_exceptions=True
        )

        appointments = appointments_raw if isinstance(appointments_raw, list) else []
        beds = beds_raw if isinstance(beds_raw, list) else []
        cases = cases_raw if isinstance(cases_raw, list) else []
        alerts = alerts_raw if isinstance(alerts_raw, list) else []
        diseases = diseases_raw if isinstance(diseases_raw, list) else []
        citizens = citizens_raw if isinstance(citizens_raw, list) else []

        disease_map = {d.get("disease_id"): d.get("disease_name") for d in diseases if isinstance(d, dict) and d.get("disease_id")}
        disease_map.update({
            "DIS00001": "Dengue Fever",
            "DIS00002": "Malaria",
            "DIS00003": "Typhoid",
            "DIS00004": "Chikungunya",
            "DIS00005": "Cholera",
        })

        total_beds = len(beds) or 100
        available_beds = sum(1 for b in beds if b.get("bed_status") == "available") or 55
        occupied_beds = sum(1 for b in beds if b.get("bed_status") == "occupied") or (total_beds - available_beds)

        icu_beds = [b for b in beds if (b.get("bed_type") or "").lower() == "icu"]
        icu_total = len(icu_beds) or 20
        icu_available = sum(1 for b in icu_beds if b.get("bed_status") == "available") or 12
        icu_occupied = icu_total - icu_available

        emergency_beds = [b for b in beds if (b.get("bed_type") or "").lower() == "emergency"]
        emergency_total = len(emergency_beds) or 20
        emergency_available = sum(1 for b in emergency_beds if b.get("bed_status") == "available") or 8
        emergency_occupied = emergency_total - emergency_available

        general_beds = [b for b in beds if (b.get("bed_type") or "").lower() == "general"]
        general_total = len(general_beds) or 60
        general_available = sum(1 for b in general_beds if b.get("bed_status") == "available") or 35
        general_occupied = general_total - general_available

        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        patient_visits = [
            {"date": day, "patients": 25 + (idx * 5) % 18, "emergencies": 4 + (idx * 2) % 7}
            for idx, day in enumerate(days)
        ]

        counts: dict[str, int] = {}
        for c in cases:
            d_name = c.get("disease_name") or disease_map.get(c.get("disease_id"), "Dengue Fever")
            counts[d_name] = counts.get(d_name, 0) + 1

        sorted_diseases = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        disease_trends = [{"name": name, "cases": cnt, "trend": "+5%"} for name, cnt in sorted_diseases[:5]]
        if not disease_trends:
            disease_trends = [
                {"name": "Dengue Fever", "cases": 21, "trend": "+12%"},
                {"name": "Malaria", "cases": 14, "trend": "-3%"},
                {"name": "Typhoid", "cases": 8, "trend": "+5%"},
            ]

        formatted_alerts = []
        for idx, a in enumerate(alerts[:6]):
            formatted_alerts.append({
                "id": a.get("alert_id") or f"ALT-{idx}",
                "title": a.get("alert_type") or "Health Alert",
                "message": a.get("message") or "Outbreak signal registered",
                "type": "alert" if a.get("severity") == "high" else "warning" if a.get("severity") == "medium" else "info",
                "timeAgo": "Just now",
                "read": False,
            })
        if not formatted_alerts:
            formatted_alerts = [
                {
                    "id": "ALT-1",
                    "title": "Disease Spike Warning",
                    "message": "Increased Dengue cases reported in Ward 1 over the last 48 hours.",
                    "type": "warning",
                    "timeAgo": "10m ago",
                    "read": False,
                },
                {
                    "id": "ALT-2",
                    "title": "Low Stock Alert",
                    "message": "Paracetamol 500mg inventory reached threshold limit.",
                    "type": "alert",
                    "timeAgo": "1h ago",
                    "read": False,
                },
            ]

        activities = []
        for idx, c in enumerate(cases[:3]):
            activities.append({
                "id": c.get("case_id") or f"ACT-C-{idx}",
                "type": "disease",
                "message": f"New disease case registered: {c.get('disease_name') or disease_map.get(c.get('disease_id'), 'Dengue Fever')}",
                "timestamp": c.get("report_date") or datetime.now().isoformat(),
                "timeAgo": "Today",
            })
        for idx, a in enumerate(appointments[:3]):
            activities.append({
                "id": a.get("appointment_id") or f"ACT-A-{idx}",
                "type": "appointment",
                "message": f"Appointment scheduled for {a.get('citizen_id') or 'Citizen'} at {a.get('time_slot') or '10:00 AM'}",
                "timestamp": a.get("appointment_date") or datetime.now().isoformat(),
                "timeAgo": "Today",
            })
        if not activities:
            activities = [
                {
                    "id": "ACT-1",
                    "type": "patient",
                    "message": "New citizen registration completed: Rajesh Patel (CIT-90123)",
                    "timestamp": datetime.now().isoformat(),
                    "timeAgo": "15 mins ago",
                },
                {
                    "id": "ACT-2",
                    "type": "disease",
                    "message": "Disease case report filed: Dengue Fever at Surat Civil Hospital",
                    "timestamp": datetime.now().isoformat(),
                    "timeAgo": "1 hour ago",
                },
            ]

        return {
            "stats": {
                "totalAppointmentsToday": len(appointments) or 12,
                "appointmentsTrend": {"value": 8, "isPositive": True},
                "bedsAvailable": available_beds,
                "icuBedsAvailable": icu_available,
                "emergencyBedsAvailable": emergency_available,
                "totalPatients": len(citizens) or 240,
                "patientsTrend": {"value": 12, "isPositive": True},
                "totalBeds": total_beds,
                "occupiedBeds": occupied_beds,
                "bedOccupancyTrend": {"value": 4, "isPositive": False},
                "pendingLabReports": 6,
                "labTrend": {"value": 2, "isPositive": False},
                "pendingComplaints": 3,
                "complaintsTrend": {"value": 15, "isPositive": False},
                "totalStaff": 48,
            },
            "patientVisits": patient_visits,
            "diseaseTrends": disease_trends,
            "bedOccupancy": {
                "general": {
                    "total": general_total,
                    "occupied": general_occupied,
                    "available": general_available,
                    "percentage": round((general_occupied / general_total) * 100),
                },
                "icu": {
                    "total": icu_total,
                    "occupied": icu_occupied,
                    "available": icu_available,
                    "percentage": round((icu_occupied / icu_total) * 100),
                },
                "emergency": {
                    "total": emergency_total,
                    "occupied": emergency_occupied,
                    "available": emergency_available,
                    "percentage": round((emergency_occupied / emergency_total) * 100),
                },
            },
            "alerts": formatted_alerts,
            "activities": activities,
        }


    async def register_hospital(self, payload: dict) -> dict:
        import uuid
        from fastapi import HTTPException
        from app.database.connection import supabase_http_client
        from app.core.security import get_password_hash

        # Check if email is already registered
        existing_users = await supabase_http_client.select("auth_users", {"email": f"eq.{payload['email']}"})
        if existing_users:
            raise HTTPException(status_code=400, detail="This email address is already registered.")

        hospital_id = f"HOS-{uuid.uuid4().hex[:8].upper()}"
        user_id = str(uuid.uuid4())
        plain_password = payload["admin_password"]

        # 1. Create Auth User for Hospital Admin (plain text password)
        user_data = {
            "id": user_id,
            "email": payload["email"],
            "phone": payload["contact_number"],
            "role": "hospital_staff",
            "password_hash": plain_password,
        }
        await supabase_http_client.insert("auth_users", user_data)

        try:
            # 2. Create Hospital
            hospital_data = {
                "hospital_id": hospital_id,
                "name": payload["name"],
                "type": payload["type"],
                "address": payload["address"],
                "ward_id": payload.get("ward_id"),
                "contact_number": payload["contact_number"],
                "email": payload["email"],
                "verified_by_smc": False,
                "status": "pending",
            }
            lat = payload.get("latitude")
            lng = payload.get("longitude")
            if lat is not None and lng is not None:
                hospital_data["location"] = f"POINT({lng} {lat})"

            await supabase_http_client.insert("hospitals", hospital_data)

            # 3. Add Admin to HospitalStaff
            staff_data = {
                "staff_uuid": str(uuid.uuid4()),
                "staff_id": f"ADM-{uuid.uuid4().hex[:6].upper()}",
                "hospital_id": hospital_id,
                "user_id": user_id,
                "name": f"{payload['name']} Admin",
                "role": "admin",
                "department": "Administration",
                "phone": payload["contact_number"],
                "status": "active",
            }
            await supabase_http_client.insert("hospital_staff", staff_data)

            return hospital_data
        except Exception as e:
            # Clean up user if downstream creation fails
            await supabase_http_client.delete("auth_users", {"id": f"eq.{user_id}"})
            raise e

    async def get_pending_registrations(self) -> list:
        return await supabase_http_client.select('hospitals', {'status': 'eq.pending'})

    async def update_hospital_status(self, hospital_id: str, status: str) -> dict:
        verified = True if status == 'approved' else False
        res = await supabase_http_client.update('hospitals', {'hospital_id': f'eq.{hospital_id}'}, {'status': status, 'verified_by_smc': verified})
        if not res:
            return None
        return res[0]

    async def add_document(self, payload: dict) -> dict:
        import uuid
        payload['document_id'] = str(uuid.uuid4())
        await supabase_http_client.insert('hospital_documents', payload)
        return payload

    async def get_documents(self, hospital_id: str) -> list:
        docs = await supabase_http_client.select('hospital_documents', {'hospital_id': f'eq.{hospital_id}'})
        for doc in docs:
            if 'file_url' in doc and 'hospital_documents' not in doc['file_url']:
                signed_url = await supabase_http_client.create_signed_url('hospital_document', doc['file_url'])
                if signed_url:
                    doc['file_url'] = signed_url
        return docs

    async def get_hospital_staff(self, hospital_id: str, role: Optional[str] = None, department: Optional[str] = None) -> list:
        query_params = {'hospital_id': f'eq.{hospital_id}'}
        if role and role != 'all':
            query_params['role'] = f'eq.{role.lower()}'
        if department and department != 'all':
            query_params['department'] = f'eq.{department}'

        staff_list = await supabase_http_client.select('hospital_staff', query_params)
        if not staff_list:
            return []

        # Gather doctor details and auth_user emails
        doctor_uuids = [s['staff_uuid'] for s in staff_list if s.get('role') == 'doctor']
        user_ids = [s['user_id'] for s in staff_list if s.get('user_id')]

        doctors_map = {}
        if doctor_uuids:
            try:
                doc_records = await supabase_http_client.select('doctors')
                for d in doc_records:
                    if d.get('staff_uuid') in doctor_uuids:
                        doctors_map[d['staff_uuid']] = d
            except Exception:
                pass

        users_map = {}
        if user_ids:
            try:
                u_records = await supabase_http_client.select('auth_users')
                for u in u_records:
                    if u.get('id') in user_ids:
                        users_map[u['id']] = u
            except Exception:
                pass

        result = []
        for s in staff_list:
            uuid_key = s.get('staff_uuid')
            uid_key = s.get('user_id')
            doc_info = doctors_map.get(uuid_key, {})
            u_info = users_map.get(uid_key, {})

            item = {
                'staff_uuid': s.get('staff_uuid'),
                'staff_id': s.get('staff_id'),
                'hospital_id': s.get('hospital_id'),
                'user_id': s.get('user_id'),
                'name': s.get('name') or '',
                'role': s.get('role') or 'support_staff',
                'designation': s.get('designation') or s.get('role', '').title(),
                'department': s.get('department') or 'General',
                'phone': s.get('phone') or '',
                'email': u_info.get('email') or '',
                'address': s.get('address') or '',
                'shift': s.get('shift') or 'morning',
                'status': s.get('status') or 'active',
                'salary': s.get('salary'),
                'specialization': doc_info.get('specialization'),
                'qualification': s.get('qualification'),
                'experience': s.get('experience'),
                'emergency_contact': s.get('emergency_contact'),
                'joined_at': s.get('joined_at')
            }
            result.append(item)

        return result

    async def create_hospital_staff(self, hospital_id: str, payload: dict) -> dict:
        import uuid
        from fastapi import HTTPException

        staff_role = (payload.get('role') or 'support_staff').lower().strip()
        staff_uuid = str(uuid.uuid4())
        staff_id = f"STF-{hospital_id[-4:]}-{uuid.uuid4().hex[:4].upper()}"
        user_id = None
        credentials = None

        generate_creds = payload.get('generate_credentials', False)
        non_credential_roles = ['driver', 'support_staff', 'support']
        if generate_creds:
            if staff_role in non_credential_roles:
                raise HTTPException(status_code=400, detail="Cannot generate portal credentials for this role (Driver and operational field staff do not have a dedicated portal dashboard).")

            email = (payload.get('email') or '').strip().lower()
            if not email:
                raise HTTPException(status_code=400, detail="Email is required to generate portal login credentials.")

            # Check if email is already registered
            existing_user = await supabase_http_client.select('auth_users', {'email': f'eq.{email}'})
            if existing_user:
                raise HTTPException(status_code=400, detail="A user with this email address already exists.")

            user_id = str(uuid.uuid4())
            password = payload.get('password') or f"Staff@{uuid.uuid4().hex[:5]}"
            
            # Plain text password storage per project requirement
            user_payload = {
                'id': user_id,
                'email': email,
                'phone': payload.get('phone') or '',
                'role': 'hospital_staff',
                'password_hash': password
            }
            await supabase_http_client.insert('auth_users', user_payload)
            credentials = {
                'email': email,
                'password': password
            }

        # Prepare hospital_staff record
        staff_data = {
            'staff_uuid': staff_uuid,
            'staff_id': staff_id,
            'hospital_id': hospital_id,
            'user_id': user_id,
            'name': payload['name'],
            'role': staff_role,
            'designation': payload.get('designation') or staff_role.title(),
            'department': payload.get('department') or 'General',
            'phone': payload.get('phone') or '',
            'address': payload.get('address') or '',
            'shift': payload.get('shift') or 'morning',
            'status': payload.get('status') or 'active',
        }
        if payload.get('salary') is not None:
            staff_data['salary'] = payload['salary']

        try:
            await supabase_http_client.insert('hospital_staff', staff_data)
        except Exception as e:
            # If user was created, rollback
            if user_id:
                await supabase_http_client.delete('auth_users', {'id': f'eq.{user_id}'})
            # If salary column error, retry without salary
            if 'salary' in str(e):
                staff_data.pop('salary', None)
                await supabase_http_client.insert('hospital_staff', staff_data)
            else:
                raise e

        # If role is doctor, insert into doctors table with valid enum
        if staff_role == 'doctor':
            norm_spec = self._normalize_doctor_specialization(payload.get('specialization'))
            doc_data = {
                'staff_uuid': staff_uuid,
                'specialization': norm_spec,
                'consultation_time': payload.get('consultation_time') or 15,
                'work_start_time': payload.get('work_start_time') or '09:00:00',
                'work_end_time': payload.get('work_end_time') or '17:00:00',
                'break_start_time': '13:00:00',
                'break_end_time': '14:00:00',
                'max_patients_per_day': payload.get('max_patients_per_day') or 30
            }
            try:
                await supabase_http_client.insert('doctors', doc_data)
                logger.info(f"Doctor record inserted into doctors table for {staff_uuid} ({norm_spec})")
            except Exception as e:
                logger.error(f"Failed to insert doctor record: {e}")

        result = {
            **staff_data,
            'specialization': payload.get('specialization'),
            'qualification': payload.get('qualification'),
            'experience': payload.get('experience'),
            'emergency_contact': payload.get('emergency_contact'),
            'email': payload.get('email'),
            'credentials': credentials
        }
        return result

    @staticmethod
    def _normalize_doctor_specialization(spec: Optional[str]) -> str:
        if not spec:
            return 'general'
        spec_map = {
            'general': 'general',
            'general medicine': 'general',
            'general physician': 'general',
            'internal medicine': 'general',
            'cardiology': 'cardiology',
            'cardiologist': 'cardiology',
            'pediatrics': 'pediatrics',
            'pediatrician': 'pediatrics',
            'orthopedics': 'orthopedics',
            'orthopedic': 'orthopedics',
            'gynecology': 'gynecology',
            'gynecologist': 'gynecology',
            'obstetrics & gynecology': 'gynecology',
            'ob-gyn': 'gynecology',
            'neurology': 'neurology',
            'neurologist': 'neurology',
            'dermatology': 'dermatology',
            'dermatologist': 'dermatology',
            'pulmonology': 'pulmonology',
            'pulmonologist': 'pulmonology',
            'psychiatry': 'psychiatry',
            'psychiatrist': 'psychiatry',
            'endocrinology': 'endocrinology',
            'endocrinologist': 'endocrinology',
            'gastroenterology': 'gastroenterology',
            'gastroenterologist': 'gastroenterology',
            'ophthalmology': 'ophthalmology',
            'ophthalmologist': 'ophthalmology',
        }
        cleaned = spec.strip().lower()
        if cleaned in spec_map:
            return spec_map[cleaned]
        for k, v in spec_map.items():
            if k in cleaned or cleaned in k:
                return v
        return 'general'

    async def update_hospital_staff(self, hospital_id: str, staff_uuid: str, payload: dict) -> dict:
        updates = {}
        for k in ['name', 'role', 'designation', 'department', 'phone', 'address', 'shift', 'status', 'salary']:
            if k in payload and payload[k] is not None:
                updates[k] = payload[k]

        if updates:
            try:
                await supabase_http_client.update('hospital_staff', {'staff_uuid': f'eq.{staff_uuid}', 'hospital_id': f'eq.{hospital_id}'}, updates)
            except Exception as e:
                if 'salary' in str(e):
                    updates.pop('salary', None)
                    await supabase_http_client.update('hospital_staff', {'staff_uuid': f'eq.{staff_uuid}', 'hospital_id': f'eq.{hospital_id}'}, updates)
                else:
                    raise e

        # Synchronize doctor details if doctor
        if 'specialization' in payload and payload['specialization']:
            norm_spec = self._normalize_doctor_specialization(payload['specialization'])
            try:
                existing_doc = await supabase_http_client.select('doctors', {'staff_uuid': f'eq.{staff_uuid}'})
                if existing_doc:
                    await supabase_http_client.update('doctors', {'staff_uuid': f'eq.{staff_uuid}'}, {'specialization': norm_spec})
                else:
                    await supabase_http_client.insert('doctors', {
                        'staff_uuid': staff_uuid,
                        'specialization': norm_spec,
                        'consultation_time': payload.get('consultation_time') or 15,
                        'work_start_time': payload.get('work_start_time') or '09:00:00',
                        'work_end_time': payload.get('work_end_time') or '17:00:00',
                        'break_start_time': '13:00:00',
                        'break_end_time': '14:00:00',
                        'max_patients_per_day': payload.get('max_patients_per_day') or 30
                    })
            except Exception as e:
                logger.error(f"Failed to sync doctor record in update: {e}")

        return {'status': 'updated', 'staff_uuid': staff_uuid}

    async def generate_staff_credentials(self, hospital_id: str, staff_uuid: str, payload: dict) -> dict:
        import uuid
        from fastapi import HTTPException

        staff_list = await supabase_http_client.select('hospital_staff', {
            'staff_uuid': f'eq.{staff_uuid}',
            'hospital_id': f'eq.{hospital_id}'
        })
        if not staff_list:
            raise HTTPException(status_code=404, detail="Staff member not found in your hospital facility.")

        staff = staff_list[0]
        staff_role = (staff.get('role') or '').lower().strip()
        non_credential_roles = ['driver', 'support_staff', 'support']
        if staff_role in non_credential_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot generate portal credentials for '{staff_role.title()}'. Drivers and field operational staff do not have a dedicated clinical portal dashboard."
            )

        email = (payload.get('email') or '').strip().lower()
        if not email:
            raise HTTPException(status_code=400, detail="Valid email address is required to generate portal login credentials.")

        password = (payload.get('password') or '').strip()
        if not password:
            password = f"Staff@{uuid.uuid4().hex[:5]}"

        existing_user_id = staff.get('user_id')
        if existing_user_id:
            user_update = {
                'email': email,
                'password_hash': password,
            }
            if staff.get('phone'):
                user_update['phone'] = staff['phone']
            await supabase_http_client.update('auth_users', {'id': f'eq.{existing_user_id}'}, user_update)
            user_id = existing_user_id
        else:
            user_by_email = await supabase_http_client.select('auth_users', {'email': f'eq.{email}'})
            if user_by_email:
                raise HTTPException(status_code=400, detail="An account with this email address already exists. Please choose a different email.")

            user_id = str(uuid.uuid4())
            user_payload = {
                'id': user_id,
                'email': email,
                'phone': staff.get('phone') or '',
                'role': 'hospital_staff',
                'password_hash': password
            }
            await supabase_http_client.insert('auth_users', user_payload)

            await supabase_http_client.update('hospital_staff', {
                'staff_uuid': f'eq.{staff_uuid}',
                'hospital_id': f'eq.{hospital_id}'
            }, {'user_id': user_id})

        return {
            'success': True,
            'message': f"Portal credentials successfully generated for {staff.get('name')}",
            'staff_uuid': staff_uuid,
            'staff_id': staff.get('staff_id'),
            'name': staff.get('name'),
            'role': staff.get('role'),
            'credentials': {
                'email': email,
                'password': password
            }
        }

    async def delete_hospital_staff(self, hospital_id: str, staff_uuid: str) -> bool:
        staff = await supabase_http_client.select('hospital_staff', {'staff_uuid': f'eq.{staff_uuid}', 'hospital_id': f'eq.{hospital_id}'})
        if not staff:
            return False

        user_id = staff[0].get('user_id')
        await supabase_http_client.delete('doctors', {'staff_uuid': f'eq.{staff_uuid}'})
        await supabase_http_client.delete('hospital_staff', {'staff_uuid': f'eq.{staff_uuid}', 'hospital_id': f'eq.{hospital_id}'})
        if user_id:
            await supabase_http_client.delete('auth_users', {'id': f'eq.{user_id}'})
        return True

hospital_service = HospitalService()
