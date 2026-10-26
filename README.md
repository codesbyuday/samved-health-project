# SAMVED — Smart Unified Public Health Ecosystem
### Solapur Municipal Corporation (SMC) Smart Health Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 📖 Executive Summary

**SAMVED** is an end-to-end smart city public health governance ecosystem designed for municipal administrative bodies (such as Solapur Municipal Corporation), healthcare institutions, diagnostic laboratories, pharmacies, and citizens. 

It provides real-time municipal health surveillance, dynamic ward health risk indexing, automated disease outbreak detection, citywide hospital infrastructure tracking (beds, doctors, ICU, equipment, ambulances), digitized citizen health cards, electronic health records (EHR), and inter-hospital referral coordination.

---

## 🏗️ System Architecture

SAMVED is engineered following a decoupled micro-frontend & modular backend architecture:

```mermaid
flowchart TD
    subgraph Clients["Presentation Layer (Next.js 16 + React 19)"]
        CP["🏛️ SMC Administrative Portal\n(/smc/*)"]
        HP["🏥 Hospital Operations Portal\n(/dashboard, /referrals)"]
        LP["🔬 Diagnostic Laboratory Portal\n(/lab/*)"]
        PP["💊 Pharmacy Inventory Portal\n(/pharma/*)"]
        CZ["📱 Citizen Care Portal\n(/citizen/*)"]
    end

    subgraph Gateway["API & Communication Layer"]
        HTTPS["HTTPS / REST API /api/v1"]
        CORS["CORS & JWT Authentication Gateway"]
    end

    subgraph Backend["Core Application Services (FastAPI + Python 3.10+)"]
        AUTH["🔐 Auth & RBAC Service"]
        SMC["📊 SMC Governance & Analytics"]
        HOSP["🏥 Hospital & Bed Management"]
        SURV["🧬 Outbreak & Disease Surveillance"]
        LAB["🧪 Laboratory & Reports Engine"]
        PHARM["📦 Pharmacy & Medicine Stock"]
        AI["🤖 Gemini AI Analysis & Detection"]
    end

    subgraph Storage["Data & Cloud Layer"]
        PG[("🐘 PostgreSQL / Supabase DB\n(20+ Relational Tables)")]
        STORE["🗄️ Supabase Cloud Storage\n(Lab Reports, Patient Records)"]
        CACHE["⚡ In-Memory & Redis Cache"]
    end

    Clients --> HTTPS --> CORS --> Backend
    Backend --> CACHE
    Backend --> PG
    Backend --> STORE
    SURV -.-> AI
```

---

## 🚀 Key Modules & Capabilities

### 1. 🏛️ Solapur Municipal Corporation (SMC) Command Center
- **City Health Dashboard**: Real-time KPI cards for hospital bed counts, active disease cases, medicine alerts, and emergency alerts.
- **Ward Health Index Monitor**: Automated health scores (0–100) per ward computed from active cases, doctor-to-population ratios, bed availability, and mortality data.
- **Disease Surveillance & Outbreak Detection Engine**: Statistical anomaly detection, growth-rate trend tracking, and automated citizen advisories.
- **Hospital Infrastructure Monitoring**: Citywide bed tracking (General, ICU, Emergency), doctor availability, medical equipment condition, and low-stock indicators.
- **Citizen Grievance / Complaint Resolution**: Complaint tracking system with SLA alerts, priority escalation, and officer remarks.
- **Vaccination Campaigns**: Management of city vaccination drives, ward targeting, and dose tracking.
- **Data Compliance Tracking**: Automated detection of stale hospital data with reminder dispatching.
- **Analytics & Report Generation**: Exportable operational reports in Excel and PDF formats.

### 2. 🏥 Hospital Operations Management
- **Live Bed Tracking**: Real-time status management (Available, Occupied, Under Maintenance) across General, ICU, and Emergency wards.
- **Digital OPD & Appointments**: Appointment scheduling with downloadable PDF slips and QR token generation.
- **Inter-Hospital Referrals**: Referral dispatch and acceptance system categorized by urgency levels.
- **Electronic Health Records (EHR)**: Secure storage of patient diagnoses, doctor prescriptions, and medical histories.
- **Telemedicine Integration**: Virtual consultations with scheduled sessions and doctor notes.

### 3. 🔬 Diagnostic Laboratory Portal
- **Test Catalog**: Management of lab test packages, categories, and pricing.
- **Sample Collection**: Sample tracking pipeline from collection to processing.
- **Report Generation**: Secure PDF diagnostic report uploads accessible via citizen portals.

### 4. 💊 Pharmacy Management
- **Medicine Inventory**: Stock tracking with automated low-stock and expiry alerts.
- **Prescription Dispensing**: Direct integration with hospital EHR prescriptions.
- **City Rare Medicine Locator**: Citywide pharmacy search for emergency and life-saving medicines.

### 5. 📱 Citizen Health Portal
- **Digital Health Card (ABHA-Aligned)**: QR-enabled digital health identity displaying emergency blood group, contact, and Aadhar linkage.
- **Health Records Vault**: Access to past hospital visits, prescriptions, and lab reports.
- **Emergency Ambulance Finder**: Emergency hospital bed and ambulance dispatch search.

---

## 🛠️ Technology Stack

| Domain | Technology / Tool | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 16.2 (App Router)](https://nextjs.org/) | Server-side rendering (SSR), RSC streaming, dynamic routing |
| **UI Library** | [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) | Type-safe component architecture |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) | Responsive design, accessible UI components, dark mode |
| **Charts & Mapping** | [Recharts](https://recharts.org/) + [Leaflet](https://leafletjs.com/) | Health trend lines, ward comparisons, GIS risk maps |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) | High-performance asynchronous RESTful APIs |
| **Async Web Server** | [Uvicorn](https://www.uvicorn.org/) + [AnyIO](https://anyio.readthedocs.io/) | ASGI production web server |
| **Database & Auth** | [Supabase](https://supabase.com/) / [PostgreSQL](https://www.postgresql.org/) | Relational database, PostgREST API, Row-Level Security |
| **Database ORM** | [SQLAlchemy 2.x](https://www.sqlalchemy.org/) + [Asyncpg](https://github.com/MagicStack/asyncpg) | Asynchronous database connection pooling |
| **AI Integration** | [Google Gemini AI API](https://ai.google.dev/) | Disease anomaly summaries and health trend insights |
| **Date & Time Utilities** | [date-fns](https://date-fns.org/) | Timezone-aware date calculations and aggregations |

---

## 📂 Repository Structure

```text
samved-health-project/
├── backend/                        # FastAPI Backend Application (Python)
│   ├── app/
│   │   ├── api/v1/                 # API Version 1 central router aggregation
│   │   ├── core/                   # Security, JWT, caching, config, logging
│   │   ├── database/               # PostgreSQL engine & Supabase HTTP client
│   │   ├── modules/                # Feature modules
│   │   │   ├── ai/                 # Gemini AI integration
│   │   │   ├── appointments/       # Patient appointments & slips
│   │   │   ├── auth/               # User authentication & RBAC
│   │   │   ├── citizens/           # Citizen registration & profile
│   │   │   ├── disease_surveillance/# Outbreak detection & statistics
│   │   │   ├── health_cards/       # Digital health cards
│   │   │   ├── hospitals/          # Hospital capacity, beds, doctors
│   │   │   ├── laboratories/       # Lab tests & diagnostic reports
│   │   │   ├── notifications/      # Multi-channel alerts & notifications
│   │   │   ├── payments/           # Billing & transaction records
│   │   │   ├── pharmacies/         # Inventory & medicine stock
│   │   │   ├── referrals/          # Inter-hospital referral workflows
│   │   │   └── smc/                # SMC analytics, wards, complaints
│   │   └── main.py                 # FastAPI application entry point
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment template
│
├── frontend/                       # Next.js 16 Web Application (TypeScript)
│   ├── src/
│   │   ├── app/                    # Next.js App Router (pages & layouts)
│   │   │   ├── (auth)/             # Login & authentication routes
│   │   │   ├── citizen/            # Citizen portal & digital card
│   │   │   ├── dashboard/          # Hospital dashboard
│   │   │   ├── lab/                # Laboratory management portal
│   │   │   ├── pharma/             # Pharmacy management portal
│   │   │   └── smc/                # Solapur Municipal Corporation (SMC) portal
│   │   ├── components/             # Reusable UI components & layouts
│   │   ├── services/               # Centralized apiClient HTTP service
│   │   └── smc/                    # SMC portal components, queries & charts
│   ├── package.json                # Frontend dependencies and npm scripts
│   ├── tailwind.config.ts          # Tailwind styling configuration
│   ├── tsconfig.json               # TypeScript configuration
│   └── .env.example                # Frontend environment template
│
└── README.md                       # Project documentation
```

---

## ⚙️ Prerequisites & Environment Setup

Before getting started, make sure you have the following installed on your workstation:

- **Node.js**: `v18.18.0` or higher (`v20.x` LTS recommended)
- **npm** or **pnpm**: `v9.x` or higher
- **Python**: `v3.10` or `v3.11` / `v3.12` / `v3.13`
- **Git**: Installed and configured
- **Supabase Account**: (Or local PostgreSQL database instance)

---

## 🛠️ Step-by-Step Local Installation

### 1. Clone the Repository

```bash
git clone https://github.com/codesbyuday/samved-health-project.git
cd samved-health-project
```

---

### 2. Backend Setup (FastAPI)

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a Python virtual environment
python -m venv venv

# 3. Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate

# 4. Install all Python dependencies
pip install -r requirements.txt

# 5. Create your environment configuration file
cp .env.example .env
```

#### Configure `backend/.env`:
Open `backend/.env` and verify your credentials:

```env
ENVIRONMENT=development
PROJECT_NAME="SAMVED FastAPI Backend"
API_V1_STR=/api/v1
SECRET_KEY=your-super-secret-jwt-key-for-development

# Supabase REST API & Database Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Direct PostgreSQL connection string (Pooler or Direct)
DATABASE_URL=postgresql+asyncpg://postgres:your-password@db.your-project.supabase.co:5432/postgres

# Google Gemini AI Key for Outbreak & Health Insights (Optional)
GEMINI_API_KEY=your_gemini_api_key

# CORS allowed frontend domains
ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

#### Run the Backend Server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Backend API URL**: `http://localhost:8000`
- **Interactive Swagger API Docs**: `http://localhost:8000/docs`
- **Redoc Documentation**: `http://localhost:8000/redoc`

---

### 3. Frontend Setup (Next.js)

Open a new terminal window:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install all Node dependencies
npm install

# 3. Create your frontend environment configuration file
cp .env.example .env
```

#### Configure `frontend/.env`:
Open `frontend/.env` and configure the backend URL:

```env
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Supabase Client Credentials (Optional for client direct queries)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Run the Frontend Development Server:

```bash
npm run dev
```
- **Frontend Portal**: Open your browser at [http://localhost:3000](http://localhost:3000)

---

## 🔑 Default User Roles & Access Accounts

For testing and local development, you can use the following default access accounts:

| Portal | URL Route | Default Email | Role |
| :--- | :--- | :--- | :--- |
| **SMC Control Center** | `/smc/login` | `smc_admin@solapur.gov.in` | `smc_admin` / Ward Officer |
| **Hospital Management** | `/login` | `hospital@health.gov` | Hospital Administrator |
| **Laboratory Portal** | `/lab/login` | `lab@health.gov` | Laboratory Technician |
| **Pharmacy Portal** | `/pharma/login` | `pharmacy@health.gov` | Pharmacist |
| **Citizen Portal** | `/citizen/CIT-SOL-0001` | *Direct Citizen Access* | Citizen |

---

## 📊 Database Schema Summary

The SAMVED PostgreSQL database comprises 20+ relational tables:

- **Governance & Geography**: `wards`, `smc_officials`, `alerts`, `notifications`
- **Institutions & Staff**: `hospitals`, `hospital_staff`, `doctors`, `provider`
- **Infrastructure & Assets**: `beds`, `hospital_wards`, `medical_equipment`, `ambulances`
- **Surveillance & Indexing**: `diseases`, `disease_cases`, `health_indicator_data`, `health_index_results`, `outbreak_signals`
- **Clinical & Pharmacy**: `appointments`, `telemedicine_sessions`, `referrals`, `health_records`, `diagnostic_reports`, `medicines`, `hospital_medicine_stock`
- **Citizen Records**: `citizens`, `vaccination_campaigns`, `vaccination_records`, `complaints`

---

## 🧪 Testing & Verification

### Run Backend Tests

```bash
cd backend
pytest
```

### Run Frontend Production Build & Lint

```bash
cd frontend
npm run build
npm run lint
```

---

## 🚢 Production Deployment

### 1. Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Add the environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://your-backend-api.onrender.com`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
5. Click **Deploy**.

### 2. Backend Deployment (Docker / Render / Railway / AWS)
A `Dockerfile` can be used to containerize the FastAPI service:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🤝 Contributing Guidelines

We welcome contributions to SAMVED! To maintain code quality:

1. **Fork the Repository** & create a feature branch (`git checkout -b feature/amazing-feature`).
2. **Commit your changes** following conventional commits (`git commit -m 'feat: add automated bed allocation alert'`).
3. **Ensure type safety & builds pass** (`npm run build` and `pytest`).
4. **Push to your branch** (`git push origin feature/amazing-feature`).
5. **Open a Pull Request**.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for Solapur Municipal Corporation & Digital Public Healthcare Governance.</sub>
</div>
