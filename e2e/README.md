# Customer Booking E2E

This Playwright suite drives one clean Chromium customer through the public
booking UI. It is an observer for a defense/demo run; k6 or another external
tool remains responsible for concurrent load.

## What the journey proves

- email/password login through the visible form;
- configured event identity and purchase entry;
- immediate or queued waiting-room admission;
- exact seated-inventory selection, or an explicitly enabled available-seat
  fallback for repeatable paid demos;
- one reservation captured from the browser-observed API response;
- recipient persistence through the customer form;
- either a payment-ready reservation or visible MockPay success;
- paid confirmation for the same reservation ID;
- video plus an allowlist-only JSON result.

The runner never creates sessions or reservations through setup APIs, never
calls the mock payment callback directly, and never cancels an active checkout.

## Install

```powershell
pnpm install
pnpm exec playwright install chromium
```

## Create a profile

```powershell
Copy-Item e2e\profiles\local.example.env e2e\profiles\local.env
```

Edit `local.env` with a dedicated non-privileged account and a controlled,
on-sale seated event. Real `*.env` profiles are ignored; only
`*.example.env` templates are committed.

For a presentation-friendly pace, `E2E_SLOW_MO_MS` delays each browser action,
`E2E_TICKET_DIALOG_REVIEW_MS` keeps the newly purchased ticket dialog visible,
and `E2E_TICKET_REVIEW_MS` keeps the verified Upcoming ticket visible at the
end. The spike template uses `1200`, `10000`, and `10000` ms respectively.

Seat selection is fail-closed by default:

```dotenv
E2E_SEAT_LABEL=A-4
E2E_SEAT_SELECTION_MODE=exact
```

For repeated paid demo runs, previously purchased seats remain sold. To prefer
the configured seat but visibly choose the first UI-reported available seat
when it is unavailable, use:

```dotenv
E2E_SEAT_SELECTION_MODE=preferred-or-first-available
```

To demonstrate directly choosing an available seat without preferring a fixed
seat, use:

```dotenv
E2E_SEAT_LABEL=AUTO
E2E_SEAT_SELECTION_MODE=first-available
```

`AUTO` is only a readable profile marker in this mode. The browser selects from
the rendered available gridcells and the final evidence replaces it with the
actual seat label.

The result evidence records the seat actually selected. Keep `exact` for
contention tests or any run where changing the target seat would invalidate the
claim.

For a deployed target:

```powershell
Copy-Item e2e\profiles\deployed.example.env e2e\profiles\defense.env
```

Both frontend and API URLs are profile values. The frontend's API URL is still
baked in at build time; the runner validates the selected target and observed
traffic but does not rewrite the frontend deployment.

## Check without opening a browser

```powershell
pnpm run e2e:booking:check -- --profile local
```

This validates every field and performs GET-only frontend/API readiness checks.
Invalid or unavailable targets exit with code `2` before a reservation can be
created. Output includes only the non-secret profile projection.

## Reservation-only rehearsal

Set:

```dotenv
E2E_COMPLETION_MODE=reservation-only
E2E_PAYMENT_METHOD=
```

Run:

```powershell
pnpm run e2e:booking -- --profile local --headed
```

Success means the captured reservation reaches `PAYMENT_READY`. It does not
claim that money settled or tickets were issued.

## Full MockPay rehearsal

Use a fresh observer account/event/seat and set:

```dotenv
E2E_COMPLETION_MODE=mock-payment-success
E2E_PAYMENT_METHOD=mock
```

Run:

```powershell
pnpm run e2e:booking -- --profile local-mock --headed
```

The flow selects the visible MockPay method, clicks `Approve Payment` on the
mock checkout page, and passes only when the customer confirmation and observed
authoritative response both report `PAID` for the captured reservation. It then
opens Tickets & Vouchers and verifies the exact purchased event and actual seat
in Upcoming.

To leave the browser on the final page for a live presentation:

```powershell
pnpm run e2e:booking -- --profile local --headed --keep-open
```

After the flow passes, the terminal prints a hold message and the browser stays
on the verified ticket page. Close the browser window when the presentation is
done; only then does Playwright finalize the video, JSON evidence, and HTML
report. `--keep-open` is opt-in and is not available with `--check` or the
multi-scenario `--test` command.

Without `--keep-open`, the browser still pauses on both purchased-ticket views
for their configured review times before it closes and saves evidence.

## Full VNPay sandbox rehearsal

Set `E2E_COMPLETION_MODE=vnpay-sandbox-success` and
`E2E_PAYMENT_METHOD=vnpay`, then provide the official sandbox origin, bank,
test card, cardholder, issue date, and test OTP through the corresponding
`E2E_VNPAY_*` profile fields. The committed spike and deployed templates use
VNPay's public successful NCB sandbox card.

The browser selects VNPay in the real customer UI, accepts navigation only to
`https://sandbox.vnpayment.vn`, completes the hosted sandbox form, follows the
signed return URL, and reuses the same paid confirmation and issued-ticket
assertions as MockPay. It never calls the return or IPN endpoint directly.

```powershell
pnpm run e2e:booking -- --profile local --headed --keep-open
```

The VNPay sandbox mode is intentionally single-browser only and must not be
included in the k6 load traffic.

## Controlled regression scenarios

```powershell
pnpm run e2e:booking:test -- --profile local
```

The selected profile runs its matching success mode. Product-failure scenarios
are opt-in because they require controlled data. Set `E2E_FAILURE_SCENARIO` to
one of:

- `invalid-credentials`
- `active-checkout`
- `waitroom-failure`
- `unavailable-seat`
- `unavailable-mock`

Profile/CLI validation, readiness, redaction, evidence schema, and failure-code
mapping are covered by the fast Vitest files under `e2e/**/*.test.ts`.

## Evidence

Every valid browser run writes:

```text
test-results/customer-booking/<run-id>/
|-- booking-result.json
|-- video.webm
|-- failure.png                 # failed visible journey only
|-- playwright-report/
`-- raw/
```

`booking-result.json` contains target origins, event/seat, timestamps, step
results, reservation ID, expected/actual outcome, and failure classification.
It never serializes the password, recipient details, cookies, authorization
headers, waitroom/payment tokens, or raw request/response bodies.

## Run beside external load

1. Give the observer a seat not targeted by deterministic contention tests.
2. Start the external load generator against the same backend environment.
3. Start the headed Playwright command independently.
4. Capture the browser, load terminal, and dashboard together with OBS if a
   combined defense video is needed.
5. Keep the Playwright JSON/video and external load report under the same human
   run label.

Playwright intentionally stays at one user. A browser E2E pass does not replace
backend oversell, payment-idempotency, expiry, or concurrency checks.

## Diagnostic trace

```powershell
pnpm run e2e:booking -- --profile local --trace
```

Trace mode is local-only and prints a warning. Traces may contain session or
network context, remain ignored, and are excluded from `booking-result.json`.

## Exit codes

| Code | Meaning                                              |
| ---: | ---------------------------------------------------- |
|    0 | Expected outcome reached and evidence finalized      |
|    1 | Browser journey/assertion failed                     |
|    2 | CLI/profile/preflight failed before browser mutation |
|    3 | Evidence finalization failed                         |

## Current verification boundary

The local customer journey has been verified through visible MockPay success,
paid confirmation, and the exact newly issued ticket in Tickets & Vouchers.
The staged waitroom run has also shown a separate browser customer queued
behind 500 active and 100 queued authenticated users before normal server-side
promotion. VNPay sandbox automation is statically validated but still requires
one live run after the Docker stack is started to confirm the current hosted
gateway selectors and return behavior. These local results do not replace
production SLO, oversell, or payment-provider evidence.
