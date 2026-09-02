# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"40 Women" (package name `challah-web`) — a community web app where users launch or join "campaigns": a request for 40 women to commit to baking challah (on behalf of someone, for a stated reason — recovery, shidduch, livelihood, etc.) before the upcoming Shabbat. Also bundles a weekly parsha page and a Shabbat candle-lighting/havdalah lookup tool.

## Commands

```bash
npm run dev       # start Vite dev server (configured port 5174, see .claude/launch.json)
npm run build     # tsc -b (project references) + vite build — this is also the type-check step
npm run preview   # preview the production build
```

There is no test suite and no lint script wired into `package.json` (oxlint config exists at `.oxlintrc.json` but isn't run via npm scripts — invoke directly with `npx oxlint` if needed).

## Architecture

**Stack**: React 18 + TypeScript + Vite, React Router v6, Supabase (Postgres + Auth) as the sole backend. No server code in this repo — all data access is client-side via the Supabase JS SDK.

**Routing / auth gate** (`src/App.tsx`): `useSession()` from `AuthContext` decides which route tree renders. No session → only `/sign-in` and `/sign-up` are reachable. With a session, all app routes render inside `Layout`. There is no per-route guard beyond this — auth state is the only switch.

**Auth** (`src/AuthContext.tsx`): wraps `supabase.auth.getSession()` / `onAuthStateChange` in a context. `session` starts as `undefined` (loading) vs `null` (signed out) vs `Session` — `AuthProvider` renders nothing until the initial check resolves.

**Supabase client** (`src/supabase.ts`): single exported client, URL/anon key hardcoded (anon/publishable key, not secret — safe to expose client-side). All authorization is expected to be enforced by Postgres Row Level Security policies on the Supabase side, not in the app code.

**Data model** (inferred from queries, no local schema file):
- `campaigns`: `id, name, reason, note?, created_by, expires_at, created_at`. `reason` is the `Reason` union in `src/types.ts`. `name` is a composed Hebrew name string like `"Chana Leah bat Sara"` (see `splitName`/name-composition logic duplicated in `LaunchPage.tsx` and `CampaignDetailPage.tsx`).
- `signups`: `id, campaign_id, user_id, city, created_at` — join table; a campaign is "full" at 40 signups (hardcoded everywhere as the number 40).
- `users`: `id, name, city` — app-level profile row keyed to the Supabase auth user id.
- `parsha`: `name, passuk, dvar_torah, created_at` — editorial content, latest row by `created_at` is shown.
- Account deletion goes through an RPC (`supabase.rpc('delete_account')`), not a direct table delete — this implies a Postgres function doing cascading cleanup.

**Page structure** (`src/pages/*`): each page is a single self-contained component that owns its own Supabase fetches, form state, and loading/error state — there's no shared data layer, query cache, or global store. Expect to find fetch + mutate logic inline in the page component, not extracted into hooks.

**Styling**: no CSS framework. `src/colors.ts` holds the palette (including `reasonColors`, a per-`Reason` badge color map) and `src/styles.ts` holds a shared `s: Record<string, CSSProperties>` object of reusable inline-style fragments (`s.card`, `s.btn`, `s.input`, `s.modal`, etc.). Pages compose these with ad hoc inline `style={{...}}` rather than CSS classes/modules — follow this pattern rather than introducing a new styling approach. `Layout.tsx` is the one place with an actual `<style>` block, used for a hamburger-menu media query.

**External APIs**: `ZmanimPage.tsx` calls the public Nominatim geocoding API and hebcal.com's Shabbat API directly from the client (no backend proxy).

**Campaign lifecycle**: a campaign's `expires_at` is always set to the upcoming Saturday night at launch time (`nextSaturdayNight()` in `LaunchPage.tsx`) — campaigns are inherently weekly and expire automatically; `MinePage`/`HomePage` filter out expired ones client-side rather than the DB enforcing it.

**Duplicated logic to be aware of**: the Hebrew-name split/compose logic (`bat`/`ben` parent name) and the reason-selection form UI are duplicated between `LaunchPage.tsx` (create) and `CampaignDetailPage.tsx` (edit-in-place). If you change one, check whether the other needs the same change.
