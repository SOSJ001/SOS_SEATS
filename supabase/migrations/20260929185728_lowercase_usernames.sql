-- Username rule (2.7): lowercase, 3-20 chars, [a-z0-9_]. UNIQUE (username)
-- plus this CHECK makes usernames unique regardless of case.

UPDATE public.web3_users
  SET username = lower(username)
  WHERE username <> lower(username);

ALTER TABLE public.web3_users
  ADD CONSTRAINT web3_users_username_format
  CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');
