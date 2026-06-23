# Clinigram Facility Manager — Web App

A standalone web app (not a Claude artifact) that your staff open like any normal website,
on any phone, tablet or computer. Talks to your backend API for all data.

## 1. Point it at your backend

Deploy the backend first (see `clinigram-backend/README.md`). You'll get a URL like
`https://clinigram-api.onrender.com`.

```bash
cd clinigram-frontend
cp .env.example .env
```

Edit `.env` and set:
```
VITE_API_URL=https://clinigram-api.onrender.com
```

## 2. Run it locally to check everything works

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173). You should land on "Welcome to
Clinigram Facility Manager" — set up your Admin account and try adding a stock item.

## 3. Deploy for free on Vercel

1. Put this `clinigram-frontend` folder in a GitHub repo (can be the same repo as the
   backend, in a subfolder, or a separate repo — either works).
2. Go to https://vercel.com → Add New → Project → import the repo.
3. If backend and frontend share a repo, set **Root Directory** to `clinigram-frontend`.
4. Add an Environment Variable: `VITE_API_URL` = your backend's URL (same as step 1).
5. Deploy. Vercel gives you a URL like `https://clinigram-facility.vercel.app` — this is
   what your staff will open.

**Netlify works the same way** if you'd rather use that — same build command (`npm run build`),
output directory `dist`, same environment variable.

## 4. Lock the backend down to only your frontend

Once you have your Vercel URL, go back to your Render backend's environment variables and
set `FRONTEND_ORIGINS` to that exact URL (instead of `*`). Redeploy the backend. This stops
random websites from being able to call your API directly.

## 5. Day-to-day use

- Bookmark the Vercel URL on every phone/tablet/computer at the facility — that's the app now.
- First person creates the Admin account; Admin then adds staff under Settings → Manage staff accounts.
- Everything saves to your shared database immediately — no more "only on one device."

## If something doesn't work

- Blank screen / "Can't reach the server" → check `VITE_API_URL` is correct and the backend's
  `/api/health` endpoint returns `{"ok":true}` in your browser.
- "Failed to fetch" in the browser console → almost always `FRONTEND_ORIGINS` on the backend
  doesn't include your frontend's URL, or the backend is asleep (free Render tier) — give it
  30-60 seconds and retry.
- Paste me the exact error message and I'll help you debug it.
