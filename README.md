# Health Agent Frontend MVP

Next.js App Router MVP for daily symptom monitoring with LGPD-by-design controls.

## Security baseline
- Secure central API client uses `credentials: 'include'` so production auth can rely on secure HttpOnly cookies instead of localStorage tokens.
- RBAC helpers enforce patient ownership, professional linked-patient access, admin global access, and active consent checks.
- Service layer audits login, patient reads, symptom writes, anamnese access, and AI report generation.
- Mock mode is enabled by default with `NEXT_PUBLIC_USE_MOCK !== 'false'`.

## Routes
- `/patient/dashboard`, `/patient/calendar`
- `/professional/patients`, `/professional/patients/[patientId]`
- `/login`, `/forbidden`
