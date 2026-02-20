# Phase 4: Global Admin Frontend

## Context Links
- **Parent Plan:** [plan.md](./plan.md)
- **Architecture:** [system-architecture.md](../../docs/system-architecture.md) -- section 8 (Global Admin App)
- **Depends on:** [Phase 2](./phase-02-api-core.md) (global admin API endpoints)
- **Frontend Research:** [frontend-stack](./research/researcher-frontend-stack-versions-and-patterns.md)

## Overview
- **Date:** 2026-02-12
- **Priority:** P2
- **Effort:** 6h
- **Description:** Next.js 16 App Router with Turbopack for global admin portal. Login, dashboard layout with sidebar, tenant CRUD, plan management, subscriptions, feature toggles, billing overview.
- **Implementation Status:** Pending
- **Review Status:** Not started

## Key Insights
- Next.js 16 uses Turbopack by default (no config needed)
- JWT stored in HttpOnly cookie; middleware.ts verifies on protected routes
- Server Components for data-fetching pages; Client Components for interactive forms/tables
- shadcn/ui from packages/ui; shared DataTable component for all list views
- `jose` library for JWT verification in middleware (Edge Runtime compatible)

## Requirements
**Functional:** Global admin login. Dashboard with tenant count + billing summary. Tenant CRUD with provisioning trigger. Plan management. Subscription assignment. Feature flag toggles. Billing overview.
**Non-functional:** Fast page loads via Server Components. Auth protection via middleware. Responsive layout. Accessible UI via shadcn/ui.

## Architecture
See Architecture doc section 8. App Router with route groups: `(auth)` for login, `(dashboard)` for protected pages. Layout wraps dashboard with sidebar + header. Fetch wrapper handles Authorization header + 401 token refresh.

## Related Code Files

**Files to create:**
```
# Auth
apps/global-admin/app/(auth)/login/page.tsx
apps/global-admin/app/(auth)/layout.tsx
apps/global-admin/middleware.ts

# Dashboard layout
apps/global-admin/app/(dashboard)/layout.tsx
apps/global-admin/app/(dashboard)/page.tsx

# Tenant pages
apps/global-admin/app/(dashboard)/tenants/page.tsx
apps/global-admin/app/(dashboard)/tenants/new/page.tsx
apps/global-admin/app/(dashboard)/tenants/[id]/page.tsx

# Plan, subscription, features, billing pages
apps/global-admin/app/(dashboard)/plans/page.tsx
apps/global-admin/app/(dashboard)/subscriptions/page.tsx
apps/global-admin/app/(dashboard)/features/page.tsx
apps/global-admin/app/(dashboard)/billing/page.tsx
apps/global-admin/app/(dashboard)/settings/page.tsx

# Shared lib
apps/global-admin/lib/api-client.ts
apps/global-admin/lib/auth.ts
apps/global-admin/lib/constants.ts

# Components
apps/global-admin/components/sidebar.tsx
apps/global-admin/components/header.tsx
apps/global-admin/components/tenant-form.tsx
apps/global-admin/components/plan-form.tsx
apps/global-admin/components/feature-toggle.tsx
```

## Implementation Steps

**1. Set up middleware.ts** -- Auth route protection using `jose` library:
```typescript
// middleware.ts -- verify JWT cookie on /dashboard/* routes
// Redirect to /login if no token or invalid token
// matcher: ['/(dashboard)(.*)']
```
Install `jose`: `pnpm add jose`

**2. Create lib/api-client.ts** -- Fetch wrapper:
- Base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
- Reads JWT from cookie, sets `Authorization: Bearer {token}`
- On 401 response, redirect to login
- Generic `get<T>`, `post<T>`, `patch<T>`, `delete<T>` methods

**3. Create lib/auth.ts** -- Login function:
- POST to `/auth/global/login` with email/password
- Store returned JWT in HttpOnly cookie via `cookies()` (server action)
- Logout: clear cookie, redirect to login

**4. Create (auth)/login/page.tsx** -- Client Component:
- Email + password form using shadcn/ui Input + Button
- Calls server action for login
- Shows error toast on failure
- Redirects to dashboard on success

**5. Create (dashboard)/layout.tsx** -- Server Component:
- Sidebar (collapsible) with nav links: Dashboard, Tenants, Plans, Subscriptions, Features, Billing, Settings
- Header with user info + logout button
- Uses shared Sidebar/Header from packages/ui or local components
- `children` slot for page content

**6. Create (dashboard)/page.tsx** -- Dashboard overview:
- Server Component fetching summary stats
- Cards: total tenants, active tenants, total revenue, pending subscriptions
- Recent activity list

**7. Create (dashboard)/tenants/page.tsx** -- Tenant list:
- Server Component; fetch `GET /global/tenants`
- DataTable with columns: name, slug, status, plan, created
- Link to detail page; "New Tenant" button

**8. Create (dashboard)/tenants/new/page.tsx** -- Create tenant:
- Client Component with form: name, slug, admin email, admin password, plan selection
- POST to `/global/tenants` (triggers provisioning)
- Show provisioning progress/status
- Redirect to tenant detail on success

**9. Create (dashboard)/tenants/[id]/page.tsx** -- Tenant detail:
- Server Component; fetch `GET /global/tenants/:id`
- Display tenant info, subscription, features
- Edit form (PATCH), suspend button (DELETE), feature toggles

**10. Create (dashboard)/plans/page.tsx** -- Plan management:
- List plans in DataTable
- Create plan form (name, price, maxProducts, maxUsers)

**11. Create (dashboard)/subscriptions/page.tsx** -- Subscription management:
- List subscriptions with tenant name + plan name
- Update subscription, set rental fee

**12. Create (dashboard)/features/page.tsx** -- Feature flags:
- List features; create new feature
- Per-tenant toggle switches

**13. Create (dashboard)/billing/page.tsx** -- Billing overview:
- Fetch `GET /global/billing`; display billing records in DataTable
- Filter by tenant, date range, status

**14. Create (dashboard)/settings/page.tsx** -- Platform settings (placeholder)

## Todo List
- [ ] Set up middleware.ts with JWT verification
- [ ] Create lib/api-client.ts fetch wrapper
- [ ] Create lib/auth.ts login/logout logic
- [ ] Build login page
- [ ] Build dashboard layout (sidebar + header)
- [ ] Build dashboard overview page
- [ ] Build tenant list + create + detail pages
- [ ] Build plan management page
- [ ] Build subscription management page
- [ ] Build feature flag management page
- [ ] Build billing overview page
- [ ] Build settings page (placeholder)

## Success Criteria
- Login stores JWT in HttpOnly cookie; redirects to dashboard
- Middleware blocks unauthenticated access to dashboard routes
- All pages fetch data from API and render correctly
- Tenant creation triggers provisioning; status reflected in UI
- Feature toggles update in real-time
- DataTable supports sorting/filtering on all list pages

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| CORS between Next.js and NestJS | Configure CORS in NestJS main.ts for localhost:3000 |
| Cookie not sent cross-origin | Use `credentials: 'include'` in fetch; same-site cookie settings |
| Stale data after mutation | Revalidate with `revalidatePath()` or `router.refresh()` |

## Security Considerations
- JWT in HttpOnly cookie (not localStorage) -- prevents XSS theft
- middleware.ts verifies token on every protected route
- CSRF protection via SameSite cookie attribute
- No secrets exposed to client (NEXT_PUBLIC_ prefix only for API URL)
- Server Actions for sensitive operations (login, tenant provisioning)

## Next Steps
- Proceed to [Phase 5: Tenant Admin Frontend](./phase-05-tenant-admin-frontend.md)
