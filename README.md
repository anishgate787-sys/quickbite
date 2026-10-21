# QuickBite

Mobile-first college canteen preorder and mess queue app. The existing `docs/HOW_IT_WORKS.md` documents the prototype screens and flows in plain English.

## Setup

1. Create a Supabase project and an Auth user/profile for the owner. No invite code is required in this version.
2. Copy `.env.example` to `.env.local` and set the URL, anon key, and service role key.
3. Run `supabase/migrations/001_init.sql` in Supabase SQL Editor. Run `supabase/seed.sql` after replacing the placeholder owner UUID.
4. Install and run:

```bash
npm install
npm run dev
```

Set the same variables in Vercel, deploy this folder as a Next.js project, and set `QUICKBITE_URL` in GitHub Actions for the scheduled keep-alive workflow.

## Assumptions

- Pickup defaults are 12:00–1:30 PM in ten-minute slots; owners can configure capacity and interval.
- Payment is intentionally offline for now: paste a QR image/data URL or use the owner’s UPI ID, then confirm manually. `lib/payments.ts` isolates future gateway integration.
- Supabase Auth owns passwords; RLS limits student data to the current student and owner data to the owner’s canteen.
- Owners can create a menu manually or import CSV. Dish names automatically receive an offline emoji visual; real food images can be added later through Supabase Storage.

## Checks

```bash
npm run typecheck
npm test
npm run build
```
