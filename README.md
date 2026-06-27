# ⛏️ Learning Quest (Next.js + Supabase)

A Minecraft-themed daily learning app for a young, capable child. It sets a few
high-quality, **adaptive** questions each day across Maths, Reading & Writing,
French and Art (with optional Science, Geometry and an interactive Physics Lab),
marks them kindly, and rewards good work with **time-capped Minecraft videos
inside the app**. A separate, PIN-protected Parent area shows how the child is
doing and holds the settings.

Questions and marking are powered by an AI model using **each family's own API
key** (Anthropic Claude or OpenAI), so content stays fresh and is pitched to the
individual child. The app still works without a key, falling back to a built-in
bank of procedurally generated questions.

This is the web rebuild of an earlier Streamlit prototype, re-architected so that
**API keys never reach the browser** and the data layer can scale.

---

## What it does

- **Adaptive difficulty.** Each subject starts hard and adjusts question by
  question: a correct answer steps the difficulty up, a miss steps it down. A
  child's level is remembered between days.
- **Starts from what they got wrong.** Tomorrow's first questions revisit skills
  they missed before, then build on from there.
- **Kind, specific marking.** Right answers get a celebration; misses get a
  gentle explanation and one thing to remember next time.
- **Minecraft video rewards.** Good work banks video minutes. The in-app YouTube
  player **hard-stops** when the time runs out, so the cap can't be clicked
  around. A grown-up curates which videos or playlist are allowed.
- **Art.** The child draws on paper, snaps a photo, uploads it, and gets warm,
  specific encouragement (AI vision when a key is set).
- **Physics Lab.** Interactive experiments for speed, Newton's second law and
  falling objects, with live animations.
- **Parent dashboard.** Accuracy, speed, strengths, the difficulty reached,
  trends over time, and an AI-written progress note.
- **Per-family accounts.** A parent signs in once. Their API key powers the whole
  family and is encrypted at rest. Each child has their own profile, progress and
  enabled subjects.

---

## Why this stack

The deciding constraint was the bring-your-own API key. A pure client app would
have to put that key in the browser, where it can be read and stolen. So the app
needs a small server tier to hold the key and proxy the AI calls.

- **Next.js 14 (App Router) on Vercel.** Server-side API routes hold the secret;
  the client never sees it. Good PWA support so it installs to a phone home
  screen.
- **Supabase (Postgres, Auth, Storage).** Email/password auth out of the box,
  Row-Level Security so a family only ever sees its own rows, Postgres for the
  dashboard's `GROUP BY` analytics, and a private Storage bucket for uploaded
  art.
- **YouTube IFrame API.** Gives a real `stopVideo()` so the earned-time cap is
  actually enforced, not just hidden.
- **Tailwind + Framer Motion + Recharts** for the blocky UI, small animations and
  the dashboard charts.

All the pure logic (adaptive engine, reward economy, analytics, AI prompt
builders, fallback question bank) lives in `src/lib/` with **no web framework
imports**, so it can be reused unchanged by a future React Native / Expo app.

---

## Project structure

```
learning-quest/
├── src/
│   ├── lib/                     # pure logic — no framework imports (Expo-ready)
│   │   ├── types.ts             # shared types
│   │   ├── config.ts            # subjects, difficulty bands, reward rules, palette
│   │   ├── adaptive.ts          # difficulty engine + local answer checking
│   │   ├── rewards.ts           # answers -> banked video minutes
│   │   ├── analytics.ts         # parent-dashboard stats
│   │   ├── content.ts           # Minecraft facts + offline fallback questions
│   │   ├── crypto.ts            # AES-256-GCM encrypt/decrypt for the API key
│   │   ├── profile.ts           # Profile -> ChildProfile mapper
│   │   ├── data.ts              # all browser reads/writes (RLS-scoped)
│   │   ├── server-settings.ts   # server-only: resolve user + decrypt key
│   │   └── ai/                  # provider-agnostic question gen / marking / reports
│   │   └── supabase/            # browser + server Supabase clients
│   ├── app/
│   │   ├── api/                 # server routes (hold the key, proxy the AI)
│   │   ├── login/               # email/password sign in + sign up
│   │   ├── play/                # the child experience
│   │   ├── parent/              # the parent area
│   │   ├── layout.tsx, page.tsx, globals.css
│   ├── components/
│   │   ├── ui/primitives.tsx    # cards, buttons, XP bar, pips
│   │   ├── CountdownTimer.tsx   # soft per-question timer
│   │   ├── RewardPlayer.tsx     # time-capped YouTube player (hard stop)
│   │   ├── ChildPicker.tsx
│   │   ├── play/                # GameShell, Home, Quiz, Reward, PhysicsLab
│   │   └── parent/              # ParentApp, Dashboard, Settings
│   └── middleware.ts            # refreshes the Supabase auth session
├── supabase/schema.sql          # tables, RLS policies, trigger, storage bucket
├── public/                      # PWA manifest + icons
├── .env.local.example
└── package.json
```

---

## Setup

You need Node 18.18+ (Node 20 or 22 recommended) and a free Supabase account.

### 1. Create the Supabase project and database

1. Create a new project at supabase.com.
2. Open the **SQL Editor**, paste the entire contents of
   `supabase/schema.sql`, and run it. This creates the `profiles`,
   `account_settings`, `sessions` and `attempts` tables, the Row-Level Security
   policies, the owner-stamping trigger, and the private `art` storage bucket.
3. By default Supabase asks new users to confirm their email. For easy local use
   you can turn this off under **Authentication → Providers → Email** ("Confirm
   email"). The login screen handles both cases.

### 2. Configure environment variables

Copy the example file and fill it in:

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` come from
  **Project Settings → API**.
- `APP_ENCRYPTION_KEY` encrypts each family's AI key at rest. Generate one:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Sign up, add a child, then open the **Parent area →
Settings** to add an AI key and approve some Minecraft videos.

### Getting an AI key

- **Anthropic (Claude):** create a key in the Anthropic Console. Default model is
  `claude-sonnet-4-6`.
- **OpenAI (ChatGPT):** create a key on the OpenAI platform. Default model is
  `gpt-4o`.

Paste it in **Settings**, press **Test connection**, then **Save**.

---

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import it at vercel.com as a new project (Next.js is detected automatically).
3. Add the same three environment variables in the Vercel project settings
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `APP_ENCRYPTION_KEY`).
4. In Supabase, add your Vercel URL under **Authentication → URL Configuration**
   so sign-in redirects are allowed.
5. Deploy. The same database is shared between local and production, so your
   profiles and progress carry over.

---

## ⚠️ Security and privacy

- **The AI key never reaches the browser.** It is encrypted with AES-256-GCM
  (`src/lib/crypto.ts`) using `APP_ENCRYPTION_KEY` and decrypted **only** inside
  server API routes (`src/lib/server-settings.ts`). The browser is told whether a
  key exists, never what it is.
- **One key per family, not shared.** Each signed-in parent account has its own
  encrypted key, scoped by Row-Level Security to that owner.
- **The Parent area is PIN-gated.** The PIN is checked **server-side** and never
  sent to the browser, so a curious child can't read it out of the page.
- **Row-Level Security everywhere.** Every table restricts rows to
  `auth.uid() = owner`. Client inserts omit `owner`; a database trigger stamps it
  from the authenticated user, so one family can never read or write another's
  data.
- **Children's data** (names, ages, answers, art) lives in your own Supabase
  project. Keep `APP_ENCRYPTION_KEY` safe: if you lose it, saved AI keys can't be
  decrypted (re-enter them); if it leaks, rotate it and have parents re-save.

---

## Design choices worth knowing

- **The per-question timer is gentle on purpose.** Each question shows a visual
  countdown to keep things moving, but reaching zero does **not** harshly fail the
  child mid-thought; a blank submission is recorded as a "timeout" so the skill is
  revisited tomorrow. The true time taken is logged for the dashboard. Adjust
  `SECONDS_PER_QUESTION` in `src/lib/config.ts`.
- **Videos are curated, not crawled.** Pulling an entire YouTube channel would
  need a paid Data API key and weakens parental control. Instead a grown-up pastes
  a short list of approved links or one playlist, and the reward player only ever
  plays from that list, hard-stopping at the earned time.
- **It works with no AI key.** If none is set (or the AI is unreachable), the app
  serves built-in questions so a child is never blocked. Maths is fully procedural
  across all ten levels; other subjects use themed banks that also mark locally.
- **Reward economy.** A perfect day across the four core subjects banks about 20
  minutes of video; each missed question costs a minute; the daily ceiling is 30.
  All in `src/lib/config.ts` (`REWARD_MINUTES_PER_SUBJECT`, `PENALTY_SECONDS`,
  `MAX_REWARD_MINUTES`).
- **Built to port.** Everything in `src/lib/` is framework-free, so a future Expo
  mobile app can reuse the engine and only swap the UI and data calls.

---

## A note on testing

The pure logic in `src/lib/` is type-checked in isolation
(`npm run typecheck:lib`). The full app type-checks with `npm run typecheck`.
Because this project talks to live Supabase and AI services, the genuine
end-to-end smoke test is running `npm run dev` against your own Supabase project
with the schema applied and the env vars set. If anything needs a small tweak on
first run, it will almost certainly be an environment or Supabase-config detail
rather than the application logic.

---

## Adding a subject

Subjects are data. Add an entry to `SUBJECTS` in `src/lib/config.ts` with a
label, emoji, grading type (`objective`, `subjective` or `creative`) and a blurb,
and it appears. Non-core subjects can be switched on per child in the Parent area.
