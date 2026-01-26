# Time Keeping Management System (TKMS)

TKMS is a production-ready time keeping and HR-adjacent platform built with Next.js (App Router), TypeScript, MongoDB and Tailwind CSS. It supports camera capture for time-in/time-out, branding and theming, admin management, and extensible HR features.

## What’s new (expanded)
- System-wide branding and theme configuration (admin Settings) with server-side CSS variable injection for zero-flash theming
- File uploads (logo, favicon, other branding) with AWS S3 integration and local fallback
- Admin UI for System Settings, including color pickers, preview and live CSS var application
- Login page theming (auth card background, auth backdrop) with tokenized footer text
- Global Tailwind → CSS variable mappings to support white-labeling without refactoring all components
- Improved API patterns, RBAC middleware (`requireAuth` / `requireAdmin`) and audited settings changes

## Key Features
- Camera capture for clock-in/out
- Employee and admin dashboards with attendance analytics
- Schedules, time entries, and manual adjustments with audit logs
- System Settings (branding, colors, logos, favicon, footer) with SSR-first application
- File uploads (S3/local) with authorization for admin uploads
- Hooks and React Query v5 powered data fetching

## Quick Start

Prerequisites
- Node.js 18+
- pnpm
- MongoDB (local or Atlas)
- Optional: AWS S3 bucket for uploads

Install
```bash
pnpm install
```

Setup env
- Copy `.env.local.example` to `.env.local` (or edit `.env.local`) and set the values. Important vars used by the app:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — server JWT secret
- `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_LOGO`, `NEXT_PUBLIC_APP_FAVICON` — branding fallbacks
- `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — optional S3 uploads

Run
```bash
pnpm dev
```

Open http://localhost:3000

Developer commands
- `pnpm run dev` — dev server
- `pnpm run build` — production build
- `pnpm run start` — start production server
- `pnpm run lint` — linter
- `pnpm run type-check` — TypeScript checks

## System Settings (Admin)
- Accessible at `/admin/settings` for super-admins
- Configure branding: `primaryColor`, `accentColor`, `sidebarBg`, `authCardBg`, `authBackdropBg`, `footerText`, `logoUrl`, `faviconUrl`, etc.
- Settings are injected into server-rendered markup (`:root` CSS variables) for first-paint theming and reapplied client-side on hydration by `Providers`.

Notes about footer text
- `footerText` accepts tokens `{year}` and `{company}` which are replaced on public pages (e.g., login).

## Uploads
- Admin uploads (logo/favicons) use `POST /api/uploads` and require admin auth. Files are stored in S3 (if configured) or `public/uploads` fallback.

## Important Code Paths
- `src/app/layout.tsx` — server-side fetch + CSS var injection
- `src/app/Providers.tsx` — client-side application of settings, favicon and CSS var fallbacks
- `src/app/admin/settings/page.tsx` — admin UI for settings
- `src/app/auth/login/page.tsx` — public login that uses CSS vars and `footerText` token replacement
- `src/server/controllers/systemSettingsController.ts` — settings GET/PATCH
- `src/lib/models/SystemSettings.ts` — system settings schema

## Data & Extensibility (HR)
TKMS is ready to extend with HR capabilities (employee profiles, leave policies, payroll export, training). Recommended next modules:

1. Employee Profiles (personal, emergency contact, documents)
2. Leave policies and accruals with approvals
3. Payroll export / connectors

If you want, I can scaffold the first model + API and an admin UI for Employee Profiles.

## Security & Roles
- JWT-based auth with middleware helpers in `src/lib/middleware/auth.ts`
- `requireAdmin` and `requireAuth` protect API routes; settings PATCH is restricted to `super-admin` role.

## Contributing
- Use branches and open PRs for feature work
- Keep UI changes accessible and prefer CSS variables for theming
- Run `pnpm run lint` and `pnpm run type-check` before opening PRs

## Troubleshooting
- If branding doesn’t apply immediately, hard-refresh the page (favicon uses cache-busting)
- If uploads return 401: ensure the request includes an `Authorization: Bearer <token>` header (admin-only endpoint)

## License
Private — All rights reserved

---
If you want, I can also:
- Add a short architecture diagram or sequence flow for theming on first paint
- Generate a `README.dev.md` with developer setup and debugging tips
