/**
 * Rebuild server domain: wallet (roadmap 1.2 / 3.1).
 * Owns: proceeds / payout Kit helpers (8.x).
 * Directory lookups: `$lib/server/walletDirectory` (web3_users via getServerSupabase).
 * New privileged wallet helpers land here; do not grow $lib/supabase.js.
 * Do not import from client components.
 */
