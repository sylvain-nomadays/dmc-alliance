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
- **Partner portal**: `[locale]/espace-pro/` — dashboard, circuits, destinations, requests, settings
- **Admin panel**: `admin/` (no locale prefix) — full content management
- Middleware (`src/middleware.ts`) checks auth for routes containing `/admin`, `/partner`, `/agency`, `/espace-pro`

### Authentication & Authorization

- Supabase Auth with cookie-based sessions managed by `@supabase/ssr`
- Server-side: `getAuthContext()` from `src/lib/auth/getAuthContext.ts` returns user, profile, partner info, and role-based flags
- Client-side: `useAuthContext()` hook from `src/hooks/useAuthContext.ts`
- Four roles: `admin`, `partner`, `agency`, `member` — permissions defined in `src/lib/auth/types.ts`
- Partners can access admin panel with limited permissions (media upload only)

### Supabase Client Variants

Located in `src/lib/supabase/`:
- `client.ts` — browser client (`createBrowserClient`) for client components
- `server.ts` — three server variants:
  - `createClient()` — server components/actions with cookie access
  - `createStaticClient()` — static generation without cookies (public data only)
  - `createAdminClient()` — service role key for privileged operations
- `session.ts` — middleware session refresh

### Database

- Schema in `supabase/schema.sql`, migrations in `supabase/migrations/`
- TypeScript types auto-generated in `src/types/database.ts`
- Key tables: `profiles`, `partners`, `agencies`, `destinations`, `circuits`, `articles`, `newsletter_subscribers`, `contact_messages`, `partner_registration_requests`, `agency_join_requests`
- Key enums: `user_role`, `circuit_status`, `difficulty_level`, `partner_tier` (premium/classic), `region`

### Data Fetching Pattern

- Server Components are the default; use `'use client'` only when state/interactivity is needed
- Data fetching functions in `src/lib/supabase/` (e.g., `circuits.ts`, `destinations.ts`, `articles.ts`, `partners.ts`)
- Static fallback data in `src/data/` is used when Supabase is unavailable

### API Routes

All under `src/app/api/`:
- `admin/` — admin CRUD operations
- `agency/` — agency profile and request management
- `ai/` — Claude-powered article assistant and itinerary rewriting
- `auth/` — registration and login flows
- `gir/` — GIR data import/sync
- `newsletter/` — subscribe, send, confirm, translate, unsubscribe
- `upload/` — media upload to Supabase Storage
- `webhooks/` — Resend email event tracking

### Styling

- TailwindCSS v4 with custom theme defined in `src/app/globals.css`
- Custom color palette: `terracotta` (primary), `sage` (secondary), `deep-blue` (accent), `sand` (neutral)
- Custom fonts: Inter (body), DM Serif Display (headings), Montserrat (accents)
- Utility function `cn()` from `src/lib/utils/utils.ts` combines `clsx` + `tailwind-merge`

### Key Integrations

- **Email**: Resend SDK (`src/lib/email/`) with HTML templates, double opt-in newsletter
- **Maps**: Mapbox GL + React Map GL for destination maps
- **PDF**: `@react-pdf/renderer` for circuit itinerary exports (`src/lib/pdf/`)
- **AI**: Anthropic SDK for content generation (`src/app/api/ai/`)
- **Rich Text**: Tiptap editor with custom extensions (`src/components/admin/tiptap-extensions/`)
- **Newsletter Builder**: Block-based drag-and-drop editor using `@dnd-kit` (`src/components/newsletter/`)

### Component Organization

- `src/components/admin/` — admin panel components
- `src/components/espace-pro/` — partner portal components
- `src/components/layout/` — Header, Footer, ConditionalLayout
- `src/components/home/` — homepage sections
- `src/components/newsletter/` — newsletter editor and block types
- `src/components/ui/` — base UI primitives (Button, Card, etc.)
- Feature-specific: `destinations/`, `partners/`

### Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server-side only)
- `RESEND_API_KEY` — Resend email service
- `ANTHROPIC_API_KEY` — Claude AI integration
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox maps

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`)
