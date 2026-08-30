# Wanderplan

A shared holiday travel planner: day-by-day itineraries, bookings, and photos,
synced across everyone invited to a trip.

Stack: Next.js (App Router) + Supabase (Postgres/Auth/Storage/Realtime) +
Mapbox + Vercel, all free-tier. See `/Users/jerronlim/.claude/plans/i-would-like-to-streamed-flute.md`
for the full architecture plan and build phases.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Apply the SQL migrations in `supabase/migrations/` to it, in order — either
   paste each file into the Supabase SQL editor, or use the CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
3. In the Supabase dashboard, disable public signups under
   Authentication → Sign In / Providers (this app is invite-only —
   accounts are created by an admin).
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
     Supabase → Settings → API.
   - `NEXT_PUBLIC_MAPBOX_TOKEN` from a free [Mapbox](https://mapbox.com) account
     (used starting Phase 3, for the map view).
5. Create your account: in Supabase → Authentication → Users, add a user with
   your email. Then in the SQL editor, make yourself the first platform admin:
   ```sql
   update profiles set is_platform_admin = true where email = 'you@example.com';
   ```
6. `npm run dev` and sign in at `/login`.

## Development

```bash
npm run dev     # start the dev server
npm run build   # production build
npx tsc --noEmit  # type-check
npx eslint .    # lint
```
