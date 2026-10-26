# SAMVED — Independent FastAPI Backend

Centralized backend service for the SAMVED Smart Unified Public Health Ecosystem.

## Architecture

The backend is structured as a **Modular Monolith** in FastAPI:

```text
backend/
├── app/
│   ├── main.py                     # FastAPI Entrypoint
│   ├── api/
│   │   └── v1/
│   │       └── router.py           # Central Router (/api/v1)
│   ├── core/                       # Config, Security, Exceptions, Logging
│   ├── database/                   # Connection, Models, Sessions
│   └── modules/                    # Self-contained business modules
│       ├── auth/
│       ├── citizens/
│       ├── hospitals/
│       ├── appointments/
│       ├── disease_surveillance/
│       ├── smc/
│       ├── laboratories/
│       ├── pharmacies/
│       ├── health_cards/
│       ├── notifications/
│       ├── ai/
│       └── payments/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## Local Setup & Execution

### 1. Requirements

- Python 3.10+
- PostgreSQL or Supabase Database

### 2. Installation

```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\activate

# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Environment Variables

Copy `.env.example` to `.env` and adjust settings:

```bash
cp .env.example .env
```

### 4. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger UI Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc Documentation: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

## How to Add a New Module (e.g., Blood Bank)

To add a new module `blood_bank`:

1. Create directory `app/modules/blood_bank/`
2. Define Pydantic request/response schemas in `app/modules/blood_bank/schemas.py`
3. Define business service logic in `app/modules/blood_bank/service.py`
4. Define FastAPI route handlers in `app/modules/blood_bank/router.py`
5. Register the router in `app/api/v1/router.py`:
   ```python
   from app.modules.blood_bank.router import router as blood_bank_router
   api_v1_router.include_router(blood_bank_router)
   ```

---

## Production Deployment Guide

### Deploying to Render / Railway / AWS App Runner / GCP Cloud Run

1. **Docker Container Deployment**:
   - Push repository to GitHub.
   - Connect repository to platform (e.g. Render / Railway).
   - Environment variables: Set `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS`.
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

2. **Connecting Frontend**:
   - On Vercel / Netlify frontend, set:
     `NEXT_PUBLIC_API_BASE_URL=https://your-fastapi-backend.onrender.com`
