# Putting Learning Quest on the web

This app is a normal Next.js app, so the simplest, free, reliable host is **Vercel**.
You can be live in about 15 minutes. Here is the whole thing, start to finish.

---

## What you need first

1. The project folder (this one).
2. Your Supabase project (the one you already use).
3. Three secrets, set as environment variables on Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key
   - `APP_ENCRYPTION_KEY` — a 32-byte base64 key used to encrypt the family AI key

Find the first two in Supabase under **Project Settings → API**.

Make the third one on your Mac in Terminal:

```bash
openssl rand -base64 32
```

Copy the line it prints. Keep it safe and use the **same** value forever — if it
changes, the saved AI key can no longer be decrypted and you would just re-enter it.

---

## One-time database setup

Open Supabase → **SQL Editor**, paste the **entire** contents of
`supabase/schema.sql`, and run it. It is safe to run more than once (everything is
"if not exists").

Then paste and run `RUN-THIS-IN-SUPABASE.sql` as well. This switches on the
optional extras:

- the **Supabase Storage** `audio` bucket where generated voice clips are cached
  (so each phrase is synthesised once, then reused — no local/server files)
- `reward_daily_cap_min` / `reward_per_correct_min` — the parent video-time controls
- `bonus_minutes` — the "give extra minutes today" button in the dashboard

The app still runs without that second file — voice just regenerates each time and
the reward/bonus controls fall back to defaults.

---

## Deploy (GitHub → Vercel)

1. Put the project on GitHub (private is fine):

   ```bash
   cd learning-quest
   git init
   git add .
   git commit -m "Learning Quest"
   # create an empty repo on github.com first, then:
   git remote add origin https://github.com/<you>/learning-quest.git
   git push -u origin main
   ```

2. Go to **vercel.com**, sign in with GitHub, click **Add New → Project**, and
   import the repo. Vercel detects Next.js automatically — leave the build
   settings as they are.

3. Before clicking Deploy, open **Environment Variables** and add the three from
   above (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `APP_ENCRYPTION_KEY`). Add them to **Production** (and Preview if you like).

4. Click **Deploy**. After a minute or two you get a URL like
   `https://learning-quest-xxxx.vercel.app`.

### Don't have GitHub handy?

You can deploy straight from your Mac instead:

```bash
npm i -g vercel
cd learning-quest
vercel            # first run links the project and asks a few questions
vercel --prod     # production deploy
```

Set the same three environment variables when prompted (or in the Vercel
dashboard afterwards), then run `vercel --prod` again.

---

## Tell Supabase about the new address

In Supabase → **Authentication → URL Configuration**, set the **Site URL** to your
Vercel URL and add it under **Redirect URLs** too. This lets sign-in work on the
live site.

---

## First run on the live site

1. Open the Vercel URL and create your parent account (sign up).
2. Go to **Parent area → Settings** and paste an **OpenAI** API key.
   - Use OpenAI for the full experience: the natural French/English voice, the
     speak-and-be-corrected recording, the generated experiments, and the reading
     stories all run on OpenAI. A Claude key works too, but voice falls back to the
     basic built-in browser voice and the generated content is disabled.
3. Add your child (name, year, avatar). Set the daily video limit and minutes per
   correct answer in Settings if you want something other than 30 min/day and 1
   min/correct.
4. Hand it over and let them play.

---

## Install it like an app (iPad / iPhone / Mac)

It is a PWA, so it installs to the home screen with its own icon:

- **iPad/iPhone (Safari):** open the site → Share → **Add to Home Screen**.
- **Mac/desktop (Chrome/Edge):** the install icon appears in the address bar.

It then opens full-screen with no browser chrome.

---

## Updating later

Push new code to GitHub and Vercel redeploys automatically. With the CLI, run
`vercel --prod` again. Environment variables and the database stay as they are.

---

## A note on cost

Vercel's free Hobby tier is plenty for a single family. The only running cost is
your OpenAI usage for voice and generated content, which the `audio_cache` table
keeps small by reusing clips. There are no other fees.
