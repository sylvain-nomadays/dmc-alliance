# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DMC Alliance is a B2B travel platform connecting travel agencies with Destination Management Companies (DMCs). Built with Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL + Auth + Storage), and TailwindCSS 4.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint
```

No test runner is configured.

Utility scripts in `scripts/` (run with `npx tsx scripts/<name>.ts`):
- `delete-user.ts` — delete a user from the database
- `upgrade-partner-owner.ts` — upgrade a partner to owner role
- `create-mai-globe-destinations.ts` — seed Mai Globe destinations
- `check-gir-circuits.ts`, `check-gir.mjs`, `debug-gir.mjs`, `fix-gir-circuits.mjs` — GIR data debugging/fixing

## Architecture

### Routing & i18n

- All public routes are under `src/app/[locale]/` with 6 locales: `fr` (default), `en`, `de`, `nl`, `es`, `it`
- Locale prefix is always present in URLs (`localePrefix: 'always'`)
- Localized pathnames are defined in `src/navigation.ts` (e.g., `/partenaires` in FR, `/partners` in EN)
- Translation JSON files live in `messages/{locale}.json`
- next-intl handles routing, message loading, and component translation via `src/i18n.ts`
- Use `Link`, `redirect`, `usePathname`, `useRouter` from `src/navigation.ts` (not from `next/link` or `next/navigation` directly)

### Protected vs Public Routes

- **Public**: `[locale]/` — destinations, magazine, partners, GIR, about, contact
- **Auth**: `[locale]/auth/` — login, register, forgot-password, reset-password, callback (not localized pathnames)
- **Newsletter**: `[locale]/newsletter/` — confirm, unsubscribe (not localized pathnames)
- **Partner portal**: `[locale]/espace-pro/` — dashboard, circuits, destinations, requests, settings, notifications, watchlist
- **Admin panel**: `admin/` (no locale prefix) — about, agency-requests, articles, circuits, destinations, homepage, join-requests, media, messages, my-agency, newsletter, partner-requests, partners, settings, translations, users
- Middleware (`src/middleware.ts`) checks auth for routes containing `/admin`, `/agency`, `/espace-pro`; also handles auth code exchange redirects for password reset

### Authentication & Authorization

- Supabase Auth with cookie-based sessions managed by `@supabase/ssr`
- Server-side: `getAuthContext()` from `src/lib/auth/getAuthContext.ts` returns user, profile, partner info, and role-based flags
- Client-side: `useAuthContext()` hook from `src/hooks/useAuthContext.ts`
- Four roles: `admin`, `partner`, `agency`, `member` — permissions defined in `src/lib/auth/types.ts`
- Partners can access admin panel with limited permissions (media upload only)

### Multi-User Account System

- Both partners (DMCs) and agencies support multiple users per account
- `partner_members` table — links users to a partner with roles: `owner`, `admin`, `member`
- `agency_members` table — links users to an agency with roles: `owner`, `admin`, `member`
- RLS policies on `partners`, `agencies`, `destinations`, `circuits`, `circuit_departures`, `quote_requests`, `team_members`, `testimonials` all check membership via these tables
- Existing partner/agency owners are seeded into their respective members tables

### Supabase Client Variants

Located in `src/lib/supabase/`:
- `client.ts` — browser client (`createBrowserClient`) for client components
- `server.ts` — three server variants:
  - `createClient()` — server components/actions with cookie access
  - `createStaticClient()` — static generation without cookies (public data only)
  - `createAdminClient()` — service role key for privileged operations
- `session.ts` — middleware session refresh and route protection

### Database

- Schema in `supabase/schema.sql`, migrations in `supabase/migrations/` (34 migration files)
- TypeScript types in `src/types/database.ts` — **note: this file is outdated and does not cover all tables**
- Key tables:
  - **Core**: `profiles`, `partners`, `agencies`, `destinations`, `circuits`, `articles`, `bookings`
  - **Multi-user**: `partner_members`, `agency_members`
  - **Circuits**: `circuit_departures`, `quote_requests`, `circuit_availability_history`
  - **Partner content**: `team_members`, `testimonials`, `external_sources`
  - **Agencies**: `agency_join_requests`, `agency_requests`, `agency_destination_interests`, `agency_notifications`, `agency_circuit_subscriptions`, `agency_interests`
  - **Notifications**: `notifications`, `notification_preferences`
  - **Email**: `email_templates`, `email_logs`, `newsletter_subscribers`, `newsletter_campaigns`
  - **CMS**: `site_settings`, `homepage_settings`, `about_page_settings`, `about_page_stats`, `about_page_milestones`, `about_page_values`
  - **Other**: `contact_messages`, `partner_registration_requests`, `gir_watchlist`, `commercial_representatives`, `article_faqs`, `translation_jobs`, `commission_tiers`
- Key enums: `user_role`, `circuit_status`, `difficulty_level`, `partner_tier` (premium/classic), `region`, `agency_request_type`, `agency_request_status`, `partner_request_status`, `booking_status`, `quote_status`

### Data Fetching Pattern

- Server Components are the default; use `'use client'` only when state/interactivity is needed
- Data fetching functions in `src/lib/supabase/` (e.g., `circuits.ts`, `destinations.ts`, `articles.ts`, `partners.ts`, `about.ts`, `homepage.ts`, `site-settings.ts`, `admin.ts`, `storage.ts`)
- Static fallback data in `src/data/` is used when Supabase is unavailable

### API Routes

All under `src/app/api/`:
- `admin/` — admin CRUD operations (including newsletter subscriber management)
- `agency/` — agency profile, circuits, notifications, logo upload, request management
- `ai/` — Claude-powered article assistant and itinerary rewriting
- `auth/` — registration, login, and forgot-password flows
- `gir/` — GIR data import, sync, and commission management
- `newsletter/` — subscribe, send, confirm, translate, unsubscribe
- `notifications/` — in-app notification management
- `partner/` — partner profile, circuits, destinations, join-requests, requests
- `partner-requests/` — partner registration request handling (approve/reject)
- `settings/` — settings management
- `translations/` — translation operations
- `upload/` — media upload to Supabase Storage
- `webhooks/` — Resend email event tracking

### Styling

- TailwindCSS v4 with custom theme defined in `src/app/globals.css`
- Custom color palette: `terracotta` (primary), `sage` (secondary), `deep-blue` (accent), `sand` (neutral)
- Custom fonts: Inter (body), DM Serif Display (headings), Montserrat (accents)
- Utility function `cn()` from `src/lib/utils.ts` combines `clsx` + `tailwind-merge`

### Key Libraries

Located in `src/lib/`:
- `supabase/` — client creation and data fetching functions
- `auth/` — authentication context, types, and notification helpers
- `email/` — Resend SDK with HTML templates, notification emails, double opt-in newsletter
- `pdf/` — `@react-pdf/renderer` for circuit itinerary exports
- `newsletter/` — newsletter block rendering and templates
- `translation/` — Anthropic-powered translation logic
- `utils.ts` — `cn()`, `formatCurrency()`, `formatDate()`, `slugify()`, `stripHtml()`, `getBaseUrl()`, etc.
- `utils/markdown.ts` — markdown utilities

### Key Integrations

- **Email**: Resend SDK (`src/lib/email/`) with HTML templates, notification emails, double opt-in newsletter
- **Maps**: Mapbox GL + React Map GL for destination maps
- **PDF**: `@react-pdf/renderer` for circuit itinerary exports (`src/lib/pdf/`)
- **AI**: Anthropic SDK for content generation and translation (`src/app/api/ai/`, `src/lib/translation/`)
- **Rich Text**: Tiptap editor with custom extensions (`src/components/admin/tiptap-extensions/`)
- **Newsletter Builder**: Block-based drag-and-drop editor using `@dnd-kit` (`src/components/newsletter/`)
- **Notifications**: In-app notification system with email preferences (`notifications`, `notification_preferences` tables)

### Component Organization

- `src/components/admin/` — admin panel components (sidebar, header, editors, importers, etc.)
- `src/components/espace-pro/` — partner portal components (PDF export, logout)
- `src/components/layout/` — Header, Footer, ConditionalLayout
- `src/components/home/` — homepage sections
- `src/components/newsletter/` — newsletter editor and block types (`blocks/` subdirectory)
- `src/components/ui/` — base UI primitives (Button, Card, etc.)
- `src/components/destinations/` — destination-specific components
- `src/components/partners/` — partner components (Mapbox map, world map SVG, video carousel)

### Next.js Configuration

- `next.config.ts` uses `createNextIntlPlugin` wrapping `./src/i18n.ts`
- `transpilePackages: ['mapbox-gl']` for ESM compatibility
- Image remote patterns: `*.unsplash.com`, `images.unsplash.com`, `*.supabase.co`
- Image formats: `['image/avif', 'image/webp']`
- `reactStrictMode: true`, `poweredByHeader: false`, `compress: true`

### Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server-side only)
- `RESEND_API_KEY` — Resend email service
- `ANTHROPIC_API_KEY` — Claude AI integration
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox maps
- `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` — app base URL (used in emails, redirects, `getBaseUrl()`)

Optional:
- `EMAIL_FROM` — email sender address (has default)
- `RESEND_WEBHOOK_SECRET` — Resend webhook verification
- `UNSUBSCRIBE_SECRET` — newsletter unsubscribe token secret (has default)

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`)
