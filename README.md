# 🎤 Karaoku — Party Karaoke SaaS

**Your phone is the microphone.** Turn any room into a karaoke party. Queue songs from YouTube, sing through your phone, invite friends with a QR code.

---

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database + Auth + Realtime:** Supabase (PostgreSQL)
- **Payments:** Stripe (one-time + subscriptions)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Styling:** Tailwind + inline styles (Nintendo red theme)
- **Languages:** English + Bahasa Malaysia toggle

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| n-red | `#E60012` (primary) |
| n-red-dark | `#B00010` (button shadow) |
| n-red-light | `#FF3347` (accents) |
| n-black | `#0A0A0A` (body bg) |
| n-dark | `#1A1A1A` (cards) |
| n-gray | `#2A2A2A` (borders) |

All buttons use **chunky Nintendo style** — 6px offset shadow, lifts on hover, sinks on press.

---

## 💰 Pricing Plans

| Plan | Price | Queue | Mic | Party Mode |
|------|-------|-------|-----|------------|
| Free | RM0 | 3 songs | 1 song | ❌ |
| Day Pass | RM9 / 24h | ∞ | ∞ | ✅ + QR |
| Monthly | RM39 / month | ∞ | ∞ | ✅ + history |
| Yearly | RM199 / year | ∞ | ∞ | ✅ + cafe license |

---

## 🚀 Zero to Live — Full Deploy Guide

### Step 1 — Install locally

```bash
unzip karaoku.zip && cd karaoku
npm install
cp .env.example .env.local
# Edit .env.local with real keys (see Steps 2-4)
npm run dev
# Open http://localhost:3000
```

### Step 2 — Supabase (database + auth)

1. Go to **[supabase.com](https://supabase.com)** → **New Project**
2. Set password, pick region `Southeast Asia (Singapore)` for Malaysian users
3. Wait ~2 min for provisioning
4. Go to **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **SQL Editor** → **New query**, paste all of `supabase/schema.sql`, click **Run**
   - This creates 10 tables, RLS policies, realtime publications, and the auto-profile trigger
6. Go to **Authentication → URL Configuration**:
   - Site URL: `https://karaoku.vercel.app` (set later after Vercel deploy, can use `http://localhost:3000` for now)
   - Redirect URLs: add `https://karaoku.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`

### Step 3 — Stripe (payments)

1. Go to **[stripe.com](https://stripe.com)** → sign up as a Malaysian merchant
2. Activate **FPX + GrabPay** in Settings → Payment methods
3. Create **3 products** in Products → Add product:

   | Product | Recurring | Price |
   |---------|-----------|-------|
   | Karaoku Day Pass | One-time | RM 9.00 |
   | Karaoku Monthly | Monthly | RM 39.00 |
   | Karaoku Yearly | Yearly | RM 199.00 |

4. Copy each product's **Price ID** (starts with `price_...`) into `.env.local`:
   - `STRIPE_PRICE_DAY`
   - `STRIPE_PRICE_MONTHLY`
   - `STRIPE_PRICE_YEARLY`
5. Copy **Secret key** → `STRIPE_SECRET_KEY`
6. Webhook (done AFTER Vercel deploy): Developers → Webhooks → Add endpoint:
   - Endpoint URL: `https://karaoku.vercel.app/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Copy `Signing secret` → `STRIPE_WEBHOOK_SECRET`

### Step 4 — YouTube API (optional, for real song search)

Without this, users search from a 12-song curated library. With it, they search all of YouTube.

1. [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. APIs & Services → Library → enable **YouTube Data API v3**
3. Credentials → Create credentials → API key
4. Copy to `.env.local` as `YOUTUBE_API_KEY`

### Step 5 — Push to GitHub

```bash
cd karaoku
git init
git add .
git commit -m "init: karaoku saas"
# Create an empty repo at github.com/YOUR_USER/karaoku first
git remote add origin https://github.com/YOUR_USER/karaoku.git
git branch -M main
git push -u origin main
```

### Step 6 — Deploy to Vercel

1. Go to **[vercel.com](https://vercel.com)** → New Project → Import your GitHub repo
2. Framework preset: **Next.js** (auto-detected)
3. Add **all env vars** from `.env.local` in the Environment Variables panel
4. Click **Deploy** — takes ~2 min
5. Once live, copy the `karaoku-xxx.vercel.app` URL
6. Back in **Supabase → Auth → URL Configuration**, replace the placeholder URL with the real one
7. Back in **Stripe → Webhooks**, add the webhook endpoint with the real URL, copy the signing secret, paste into Vercel env vars, redeploy

### Step 7 — Custom domain (optional)

1. Buy domain (e.g., `karaoku.app`) from Namecheap/Cloudflare
2. Vercel → Project Settings → Domains → Add
3. Follow DNS instructions
4. Update `NEXT_PUBLIC_APP_URL` env var + Supabase redirect URLs + Stripe webhook to new domain

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing (hero + features + steps)
│   ├── login/page.tsx                # Magic link auth
│   ├── auth/callback/route.ts        # Supabase session exchange
│   ├── pricing/page.tsx              # 4-tier pricing page
│   ├── checkout/                     # Stripe checkout with promo codes
│   ├── dashboard/                    # Authenticated host area
│   │   ├── layout.tsx                # Wraps in DashboardShell
│   │   ├── page.tsx                  # Home (stats + recent parties)
│   │   ├── parties/                  # List + create party
│   │   ├── songs/page.tsx            # Favorite songs
│   │   ├── history/page.tsx          # Playback history
│   │   ├── settings/page.tsx         # Profile + audio prefs
│   │   └── admin/promo/page.tsx      # Promo code manager (admin only)
│   ├── party/[code]/                 # Host party room
│   ├── join/                         # Guest entry (public)
│   ├── e/[code]/                     # Guest party view (public)
│   └── api/
│       ├── checkout/route.ts         # Creates Stripe session + promo coupon
│       ├── webhooks/stripe/route.ts  # Upgrades user on successful payment
│       └── youtube/search/route.ts   # YouTube Data API proxy
├── components/
│   ├── ui/                           # Button, Logo, LangToggle
│   ├── dashboard/DashboardShell.tsx  # Sidebar (desktop) + drawer + bottom nav (mobile)
│   ├── party/                        # PartyRoom, YTPlayer, MicPanel, QRModal, AddSongModal
│   └── guest/                        # GuestJoin, GuestParty
├── lib/
│   ├── supabase/                     # client.ts + server.ts (with adminClient)
│   ├── i18n/                         # translations.ts + LangProvider.tsx
│   ├── mic.ts                        # MicManager (getUserMedia + AudioContext interactive)
│   └── karaoke-library.ts            # 12 curated karaoke video IDs
├── types/index.ts                    # Profile, Party, QueueItem, PLANS, design tokens
└── middleware.ts                     # Protects /dashboard/* and /party/* routes
```

---

## 🔑 Admin Access

The admin panel (`/dashboard/admin/promo`) is only visible to emails listed in `src/types/index.ts`:

```typescript
export const ADMIN_EMAILS = ['danielnordin53@gmail.com']
```

Change this array to your email before deploying.

---

## 🔄 Deploy Workflow (every change after go-live)

```bash
# 1. Edit code locally
npm run dev

# 2. Commit + push
git add .
git commit -m "fix: button color on mobile"
git push

# 3. Vercel auto-deploys in ~90 seconds
# 4. Done.
```

Commit message convention:
- `feat:` new feature
- `fix:` bug fix
- `ui:` visual change only
- `refactor:` code restructure
- `content:` text/copy update

---

## 📱 Features

### For hosts (logged in)
- Create a party with custom name + type
- YouTube IFrame player with auto-advance
- Phone-as-microphone (<50ms latency via `AudioContext({ latencyHint: 'interactive' })`)
- Echo cancellation + noise suppression (toggle in settings)
- Live mic level visualizer, volume slider
- Queue management (skip, remove, reorder by votes)
- QR code invite for friends (Day Pass+)
- Playback history + favorite songs
- Bilingual EN/BM UI

### For guests (public, no login)
- Scan QR code OR enter 6-char code manually
- Enter name and join
- Add songs to queue
- Upvote songs (1 vote per person via browser fingerprint)
- See now-playing + live queue updates

### Admin
- Create/toggle/expire promo codes
- Track usage counts

---

## 🧪 Testing Locally

```bash
npm run dev
# Host flow: http://localhost:3000 → Start Party → login → create → party room
# Guest flow (different browser or incognito): http://localhost:3000/join → enter code
```

Test cards for Stripe: `4242 4242 4242 4242` (any future date, any CVC, any zip)

---

## 🐛 Troubleshooting

- **"YouTube video unavailable"** → Some music videos block embedding. The 12 library songs are all known to work. Test with `RBumgq5yVrA`.
- **Mic doesn't activate** → Mic needs HTTPS (or localhost). Vercel is HTTPS automatically.
- **Realtime queue doesn't sync** → Check Supabase → Database → Replication. `queue_items` should be in the realtime publication.
- **Stripe webhook failing** → Check Stripe Dashboard → Developers → Webhooks → latest event. Signing secret must match `STRIPE_WEBHOOK_SECRET`.
- **Auth redirect broken** → Supabase → Auth → URL Config must include the Vercel URL in Redirect URLs.

---

## 📜 License

© 2026 Karaoku. Made in Malaysia 🇲🇾
