# Health Agent Frontend MVP

Next.js App Router MVP for daily symptom monitoring with LGPD-by-design controls.

## Security baseline
- Secure central API client uses `credentials: 'include'` so production auth can rely on secure HttpOnly cookies instead of localStorage tokens.
- RBAC helpers enforce patient ownership, professional linked-patient access, admin global access, and active consent checks.
- Service layer audits login, patient reads, symptom writes, anamnese access, and AI report generation.
- Mock mode is enabled by default with `NEXT_PUBLIC_USE_MOCK !== 'false'`.


## Architecture notes
- FastAPI remains the primary backend for business rules and data access. The frontend only calls FastAPI through `ApiClient`.
- Auth is accessed through the `AuthProvider` interface, with Supabase isolated as an optional infrastructure adapter.
- Domain services (`patients`, `reports`, `users`, symptoms, anamnese) depend on application types and `ApiClient`, not on Supabase SDKs.
- Supabase Postgres may still be used behind FastAPI; the frontend does not access the database directly.
- A future move to AWS Cognito + RDS should be handled by replacing the auth adapter and backend infrastructure, without changing React pages.

## Routes
- `/patient/dashboard`, `/patient/calendar`
- `/professional/patients`, `/professional/patients/[patientId]`
- `/login`, `/forbidden`
