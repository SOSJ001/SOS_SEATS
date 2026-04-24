# `src/routes/api` — contract for web and mobile

SvelteKit `+server` routes under `src/routes/api` are the **stable HTTP surface** for the web app today and for a future native client (e.g. Kotlin). Treat new and updated handlers as a **versioned contract**: prefer additive fields and documented error codes over breaking shape changes.

## Response envelope

Standard shape for **new or updated** JSON endpoints:

| Field     | Type                | Meaning                                                                        |
| --------- | ------------------- | ------------------------------------------------------------------------------ |
| `success` | `boolean`           | `true` if the request succeeded.                                               |
| `data`    | `T` (optional)      | Payload when `success === true`.                                               |
| `error`   | `string` (optional) | Human-readable message when `success === false`.                               |
| `code`    | `string` (optional) | Machine-readable error identifier for clients (logging, branching, i18n keys). |

Legacy handlers may still return `{ success, message }` (e.g. some wallet routes). Migrate toward `error` + `code` when touching those files.

**Auth (today):** Most session-protected routes expect the **browser cookie** set by the app / Supabase SSR (`Cookie` header on same-origin requests). A future mobile app may send **`Authorization: Bearer <supabase_jwt>`** instead; document per route when that is supported.

## Example: Monime payment code (aligned)

`POST /api/monime/payment-code` is the reference implementation for the envelope.

| Item            | Detail                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**        | None (server uses `MONIME_*` private env only).                                                                                                        |
| **Headers**     | `Content-Type: application/json`.                                                                                                                      |
| **Body**        | `{ name, amount: { currency, value }, mode?, duration?, authorizedProviders?, metadata?, reference? }`                                                 |
| **Idempotency** | Server generates a fresh `Idempotency-Key` (UUID) per Monime HTTP attempt (retries use new keys).                                                      |
| **Success**     | `{ "success": true, "data": <Monime payment code result> }`                                                                                            |
| **Error**       | `{ "success": false, "error": "<message>", "code": "<CODE>" }` — optional `details` may appear for debugging; do not rely on it in production clients. |

### Error codes (`payment-code`)

| `code`                       | When                                                      |
| ---------------------------- | --------------------------------------------------------- |
| `MONIME_NOT_CONFIGURED`      | Missing `MONIME_API_KEY` or `MONIME_SPACE_ID`.            |
| `MONIME_PAYMENT_CODE_FAILED` | Monime returned a non-retryable or exhausted-retry error. |

Other Monime routes should adopt the same `success` / `data` / `error` / `code` pattern when edited.

## Related money paths

| Route                                   | Notes                                                                                                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/orders/fulfill-mobile-money` | Session required; verifies payment with Monime before DB writes; uses typed request body and envelope-style errors where applicable.                                                                                              |
| `POST /api/payouts`                     | **Preferred** merchant payout: session cookie required; compares requested amount to **available** mobile-money balance (orders minus completed withdrawals for the organizer’s events + `wallet_address`) before calling Monime. |
| `POST /api/monime/payout`               | Low-level Monime proxy (no session). Still used internally by `monimeService`; new clients should call `/api/payouts`.                                                                                                            |

### `POST /api/payouts`

| Item        | Detail                                                                                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**    | Session cookie (same as other dashboard APIs).                                                                                                                                                                                                                                                          |
| **Body**    | `{ wallet_address, amount: { currency, value }, destination: { providerCode, accountId }, source?, metadata?, reference? }` — `wallet_address` must match the wallet used for `wallet_transactions` withdrawals; `amount.value` is in **major** units (e.g. NLe), consistent with `/api/monime/payout`. |
| **Success** | `{ success: true, data: <Monime payout result> }`                                                                                                                                                                                                                                                       |
| **Errors**  | `code`: `WALLET_ADDRESS_REQUIRED`, `INVALID_AMOUNT`, `INVALID_DESTINATION`, `INSUFFICIENT_BALANCE`, `MONIME_NOT_CONFIGURED`, `MONIME_PAYOUT_FAILED`.                                                                                                                                                    |

### `POST /api/tickets/verify`

Door check-in for **event organizers** only. Reuses DB RPCs `check_in_guest` and `validate_and_check_in_ticket`. The main scanner UI (`src/routes/(authed)/dashboard/scanner/+page.svelte`) calls this endpoint for check-in after validation/confirm.

| Item            | Detail                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**        | Session cookie; `user_Id` must own `event_id` (`events.user_id`).                                                                                                                              |
| **Headers**     | `Content-Type: application/json`.                                                                                                                                                              |
| **Body**        | `{ event_id: UUID, scan: string, check_in_location?: string }` — `scan` is either a **guest UUID** (invite ticket) or a **Solana wallet address** (order-item ticket path).                    |
| **Success**     | `{ success: true, data: { route: "guest" \| "wallet", ... } }` — wallet path includes `ticket_info` from the RPC.                                                                              |
| **Idempotency** | Second check-in returns `409` / `ALREADY_CHECKED_IN` (guest) or `400` with message from wallet RPC.                                                                                            |
| **Codes**       | `INVALID_BODY`, `INVALID_EVENT_ID`, `MISSING_SCAN`, `NOT_EVENT_ORGANIZER`, `INVALID_QR`, `WRONG_EVENT`, `ALREADY_CHECKED_IN`, `INVALID_TICKET_STATUS`, `CHECK_IN_FAILED`, `CHECK_IN_REJECTED`. |

### Collector gallery (public page)

| Item      | Detail                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Route** | `GET /collection/[id]` — `id` is a **guest id** or **order_item id** (UUID).                                                            |
| **Data**  | Loaded via RPC `get_collection_ticket_display` (safe fields only: event name/date/location, ticket type, checked-in vs souvenir label). |

## Health probes (unauthenticated)

Public JSON for uptime checks (no secrets). Rate-limit at the edge in production if needed.

| Route                    | Behavior                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `GET /api/health/monime` | `HEAD https://api.monime.io/` with timeout; returns `{ ok, latencyMs, status, checkedAt }`.            |
| `GET /api/health/solana` | JSON-RPC `getSlot` to `PUBLIC_SOLANA_RPC_URL`; returns `{ ok, latencyMs, status?, slot?, checkedAt }`. |

The **SOS Pulse** UI (`/dashboard/ops/pulse`) is gated by `OPS_ADMIN_USER_IDS` (comma-separated organizer `user_Id` values from session); only those users see the nav link and can load the page.

## Versioning

When a **breaking** change is unavoidable, prefer introducing `src/routes/api/v1/...` and keeping legacy routes as thin wrappers with a deprecation timeline, rather than silently changing field names or status codes.
