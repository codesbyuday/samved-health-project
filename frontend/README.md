# Hospital Management Portal

Premium Hospital Management Web Portal developed by **Tech-Lifter** for hospital-side clinical and operational workflows.

This portal is designed for hospital-side operations and is used by:

- Doctors
- Nurses
- Admin staff
- Hospital operators

It supports secure hospital workflows such as patient record management, appointments, lab reporting, medicine inventory, complaints handling, referrals, infrastructure monitoring, and role-based access control.

## Description

The Hospital Management Portal is a modern web application built to digitize and centralize day-to-day hospital operations. It connects hospital staff with operational, clinical, and analytics workflows while maintaining hospital-level data isolation and secure access control.

The system is structured to support both:

- **internal hospital operations** through authenticated staff dashboards
- **public health visibility** through controlled analytics and centralized reporting flows

## Features

### Core Hospital Operations

- Appointment management system
- Patient record management with doctor-only medical editing
- Citizen and patient search workflows
- QR-based Health Card generation and scanning support
- Bed, ICU, and emergency bed monitoring
- Infrastructure and ambulance status monitoring
- Complaint management system
- Notification-driven workflow support

### Clinical and Reporting Features

- Treatment record creation with hospital and staff auto-fill
- Doctor-only treatment updates with nurse-limited note updates
- Lab report upload, viewing, and secure downloading
- Disease reporting and analytics workflows
- Inter-hospital referral system
- Centralized health record visibility for authorized staff

### Inventory and Resource Tracking

- Medicine stock tracking
- Low-stock and threshold-based inventory awareness
- Hospital infrastructure status updates
- Equipment and ambulance operations tracking

### Role-Aware Experience

- Role-based dashboards
- Role-based sidebar module visibility
- Restricted actions based on permission level
- Hospital-level data isolation for all authenticated users

### Special Functionalities

- Real-time infrastructure updates
- Data freshness indicators on dashboards and analytics
- Integration-ready architecture for centralized Health Index workflows
- Secure medical data handling with protected backend routes

## Tech Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

### Backend and Data Layer

- Next.js API Routes
- Supabase PostgreSQL
- Supabase Storage

### Document and Reporting

- jsPDF for PDF/report generation

## System Architecture

The application follows a **Next.js full-stack architecture**:

- **App Router pages** for route-based UI
- **feature components** for modular hospital workflows
- **Next.js API routes** for secure backend operations
- **Supabase PostgreSQL** for structured health and hospital data
- **Supabase Storage** for protected medical files such as lab reports
- **React Context-based session state** for authenticated user profile handling
- **RBAC utility layer** for role-aware UI and backend permission enforcement

At a high level:

1. Users authenticate through a custom login flow against the `auth_users` table
2. Staff profile data is fetched from `hospital_staff` and related hospital records
3. The frontend renders modules dynamically based on role permissions
4. Backend routes enforce both role validation and hospital ownership checks
5. Private documents are served through signed URL-based secure access flows

## Installation & Setup

### Prerequisites

- Node.js 20 or later
- npm
- Supabase project with required tables and storage configured

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

## Environment Variables

Create a `.env` file using the project environment requirements.

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Recommended for secure production usage:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Notes

- `NEXT_PUBLIC_SUPABASE_URL` is used to connect the application to Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is used for client-safe database and storage operations
- `SUPABASE_SERVICE_ROLE_KEY` is recommended for secure server-side API operations
- Never expose the service role key to the frontend

## Folder Structure

Basic project structure:

```text
src/
├── app/                    # App Router pages and API routes
│   ├── api/                # Backend API endpoints
│   ├── dashboard/          # Main protected hospital portal route
│   ├── login/              # Staff login page
│   ├── profile/            # User profile page
│   ├── settings/           # Account settings page
│   ├── help/               # Help and support page
│   └── citizen/            # Citizen verification and profile pages
├── components/
│   ├── dashboard/          # Dashboard shell, charts, notifications
│   ├── appointments/       # Appointment management
│   ├── citizens/           # Citizen services and health card
│   ├── patients/           # Patient records and treatment workflows
│   ├── lab/                # Lab report features
│   ├── beds/               # Bed management
│   ├── infrastructure/     # Equipment and ambulance monitoring
│   ├── disease/            # Disease analytics and reporting
│   ├── medicine/           # Medicine stock management
│   ├── referrals/          # Referral workflows
│   ├── complaints/         # Complaint management
│   ├── staff/              # Staff management
│   ├── landing/            # Public landing and analytics UI
│   ├── layout/             # Navbar, sidebar, footer
│   └── ui/                 # shadcn/ui base components
├── contexts/               # Auth and theme state
├── hooks/                  # Custom hooks including RBAC helpers
├── lib/                    # Auth, RBAC, utility, Supabase config
└── services/               # Shared data and storage service logic
```

## Security Features

- Custom authentication using `auth_users` table
- No dependency on Supabase Auth for staff login
- Role-Based Access Control (RBAC)
- Middleware protection for private routes
- Hospital-level data isolation
- Backend validation for role and hospital ownership
- Secure file access using signed URLs
- Protected API-driven access to private lab reports
- Limited exposure of citizen-sensitive data in analytics and public views

## Future Improvements

- SMC official portal access module
- Provider-specific login and dashboard module
- Advanced audit logs for staff actions
- Multi-hospital super-admin reporting tools
- Enhanced alerting and outbreak notification workflows
- More public health filter controls for public analytics
- Exportable analytics and operational reports
- Deeper centralized Health Index integrations

## License

This project is intended for institutional healthcare deployment and academic demonstration by Tech-Lifter.
