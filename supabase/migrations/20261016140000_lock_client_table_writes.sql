-- Organisers reach guests, ticket types, events and wallet rows only through the server (service role).
-- Public reads of events and ticket_types stay for the marketplace (anon key).
REVOKE INSERT, UPDATE, DELETE ON public.guests, public.ticket_types, public.events, public.wallet_transactions
  FROM anon, authenticated;
REVOKE SELECT ON public.guests FROM anon, authenticated;
