# ⚡ 10-Minute Deploy Checklist

Print this, check each box as you go.

## 🟥 Before you start
- [ ] GitHub account ready
- [ ] Credit card ready (for Stripe live mode verification, not charged for signup)

---

## 1️⃣ Supabase (3 min)

- [ ] Sign up at [supabase.com](https://supabase.com)
- [ ] New Project → name: `karaoku`, region: Singapore, strong password
- [ ] Wait ~2 min for provisioning
- [ ] SQL Editor → paste `supabase/schema.sql` → Run
- [ ] Settings → API → copy 3 values:
  - [ ] `Project URL` → save somewhere
  - [ ] `anon public` key → save
  - [ ] `service_role` key → save (⚠ keep secret)
- [ ] Authentication → URL Configuration → Redirect URLs → add:
  - [ ] `http://localhost:3000/auth/callback`

---

## 2️⃣ Stripe (3 min)

- [ ] Sign up at [stripe.com](https://stripe.com) as Malaysian merchant
- [ ] Settings → Payment methods → enable FPX + GrabPay
- [ ] Products → Add Product × 3:
  - [ ] Karaoku Day Pass — One-time — RM 9.00 — copy Price ID
  - [ ] Karaoku Monthly — Monthly — RM 39.00 — copy Price ID
  - [ ] Karaoku Yearly — Yearly — RM 199.00 — copy Price ID
- [ ] Developers → API keys → copy Secret key

---

## 3️⃣ Local setup (1 min)

```bash
cd karaoku
npm install
cp .env.example .env.local
```

- [ ] Edit `.env.local` — paste all 8 values (Supabase × 3, Stripe × 4)
- [ ] Change admin email in `src/types/index.ts` → `ADMIN_EMAILS`
- [ ] Test: `npm run dev` → open http://localhost:3000
- [ ] Try Start Party → magic link → dashboard works? ✅

---

## 4️⃣ GitHub (1 min)

- [ ] Create empty repo at github.com/YOUR_USER/karaoku
- [ ] ```bash
      git init && git add . && git commit -m "init"
      git remote add origin https://github.com/YOUR_USER/karaoku.git
      git push -u origin main
      ```

---

## 5️⃣ Vercel (2 min)

- [ ] [vercel.com](https://vercel.com) → New Project → Import GitHub repo
- [ ] Environment Variables → paste all 8 from `.env.local`
- [ ] Deploy → wait ~90 sec
- [ ] Copy live URL (e.g., `karaoku-abc.vercel.app`)

---

## 6️⃣ Final wiring (1 min)

- [ ] Supabase → Auth → Redirect URLs → add `https://YOUR-VERCEL-URL/auth/callback`
- [ ] Stripe → Webhooks → Add endpoint:
  - [ ] URL: `https://YOUR-VERCEL-URL/api/webhooks/stripe`
  - [ ] Event: `checkout.session.completed`
  - [ ] Copy signing secret → add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
- [ ] Vercel → Deployments → Redeploy (to pick up new env var)

---

## ✅ Done. Test the full flow:

1. Open live URL in incognito
2. Start Party → login with real email → check inbox → click magic link
3. Dashboard loads → New Party → party room opens
4. Add song → YouTube plays → skip works
5. Click Invite (should block free user, show upgrade) → go to Pricing → buy Day Pass with test card `4242 4242 4242 4242`
6. Stripe webhook fires → profile updates → Invite now works
7. Scan the QR with your phone → you land on `/join/CODE` → add name → add song → see it appear on host's screen instantly ✨

---

## 🆘 Something broken?

See `README.md` → Troubleshooting section. Most common: Supabase redirect URL missing, or Vercel not redeployed after adding webhook secret.
