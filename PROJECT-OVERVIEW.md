# Clinigram Facility Manager — Online Edition

Two folders, two deployments:

```
clinigram-backend/    Node.js + Express + Postgres API — the brain, holds all data
clinigram-frontend/   React web app — what your staff actually open and use
```

## Deploy order

1. **clinigram-backend** first — follow `clinigram-backend/README.md`.
   You'll end up with an API URL like `https://clinigram-api.onrender.com`.
2. **clinigram-frontend** second — follow `clinigram-frontend/README.md`, pointing it at
   the backend URL from step 1. You'll end up with a web app URL like
   `https://clinigram-facility.vercel.app`.
3. Go back to the backend's environment variables and restrict `FRONTEND_ORIGINS` to that
   frontend URL.

Total cost: \u20a60, using Render's free web service tier + Supabase's free Postgres tier +
Vercel's free hosting tier. The only real downside of staying fully free is the backend
sleeps after 15 minutes of inactivity and takes ~30-60 seconds to wake up on the first
request of the day — a small one-time wait each morning.

## What changed from the in-chat prototype

This used to live entirely inside a Claude artifact, with data in a shared key-value
store. That was great for prototyping fast but had real limits: no proper security
boundary, and it only worked while a Claude conversation/artifact session was open.

Now:
- Real PostgreSQL database — your data persists independently of Claude entirely.
- PINs are hashed (bcrypt) and verified server-side, never sent or stored in plain text.
- Admin-only actions (deleting transactions, managing staff, managing the price list,
  wiping data) are enforced **on the server**, not just hidden in the interface.
- Revenue figures for non-admins are withheld by the server itself — the data never
  reaches their browser, rather than just being hidden by the UI.
- Dispensing stock and restocking are atomic database transactions, so concurrent staff
  actions can't corrupt your stock counts.
- Every meaningful action is audit-logged automatically by the server.

## If you want to keep developing with my help

Send me the exact error message (from the browser console, or Render's logs tab) and I can
usually tell you exactly which line to fix. I can't deploy or browse the live site myself
(no network access on my end), so I'll need you to be my eyes for anything that requires
checking the running app.
