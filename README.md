# SOS SEATS

Event ticketing for Sierra Leone. Buyers pay with Orange Money or Afrimoney through Monime. Organisers create events, issue tickets, and withdraw proceeds. Door staff scan entry QR codes.

## Product

- Public marketplace, event detail, and checkout
- Buyer guide at `/how-to-buy`
- Organiser event create/publish, wallet, and withdraw
- Attendee My Tickets with entry QR
- Ticket transfers by username
- Door scanner and door-staff invite / assign

## Stack

- SvelteKit 1, Svelte 4, Vite
- Tailwind CSS, lucide-svelte, Plus Jakarta Sans / Space Grotesk
- Supabase (Postgres + RLS)
- Kit `/api` routes and `$lib/server/*` for privileged I/O
- Monime payment codes and webhooks
- html5-qrcode / qrcode for scanning and ticket QR

`@solana/web3.js` remains in dependencies for residual / SKIP roadmap work. It is not the primary payment path.

## Design and roadmap

- [HI-FI (Figma)](https://www.figma.com/design/r7WJ5vTjJU3Bl4fz4ZQfnV/HI-FI)
- [DETAILED BUILD ROADMAP (FigJam)](https://www.figma.com/board/IARA8qABonZqDXM1I4P7Lq/DETAILED-BUILD-ROADMAP)

## Architecture notes

- App I/O uses plural tables only (`events`, `guests`, `orders`, …). Singular legacy tables were dropped; `legacy_id_map` is the merge audit trail.
- New privileged work belongs under `$lib/server/<domain>`, not new Kit service-role helpers in `src/lib/supabase.js`.
- Product sessions use a signed `userSession` cookie (`SESSION_SECRET`).

## Setup

```bash
git clone https://github.com/yourusername/SOS_SEATS.git
cd SOS_SEATS
npm install
cp .env.example .env
# Add PUBLIC_SUPABASE_* and fill remaining vars (see Configuration)
npm run dev
```

Other scripts:

```bash
npm run build
npm run check
```

## Configuration

Copy `.env.example` to `.env`, then set at least:

```env
# Supabase (required; not listed in .env.example)
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=

# Session cookie HMAC (required in production, 32+ characters)
SESSION_SECRET=

# Fees (see .env.example for mode / percent / flat options)
PUBLIC_BOOKING_FEE_MODE=percent
PUBLIC_BOOKING_FEE_PERCENT=0.99
PUBLIC_BOOKING_FEE_FLAT=1
PUBLIC_PLATFORM_FEE_PERCENT=5
PUBLIC_WITHDRAWAL_MONIME_FEE_PERCENT=1

# Monime (server-only; never expose as PUBLIC_*)
MONIME_API_KEY=
MONIME_SPACE_ID=
MONIME_ENVIRONMENT=test
MONIME_PAYOUT_API_KEY=
MONIME_WEBHOOK_SECRET=
```

Monime account and Space setup: [Monime Dashboard](https://dashboard.monime.io).

## Team

- Jennifer E.K Kargbo: Lead Writer and Content Creator
- Amara D. James: Product Manager and UX Designer
- Michael S.O.S Johnson: Lead Developer
