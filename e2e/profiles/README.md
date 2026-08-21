# E2E profile reference

Environment reference for these runners:

| Code | Runner                                           |
| ---- | ------------------------------------------------ |
| B    | `pnpm run e2e:booking -- --profile <name>`       |
| S    | `pnpm run e2e:contention -- --profile <name>`    |
| G    | `pnpm run e2e:ga-contention -- --profile <name>` |

Profiles live at `e2e/profiles/<name>.env`. Copy the matching
`*.example.env`; real profiles are ignored by Git.

Rules:

- Process-level allowlisted `E2E_*` values override profile values.
- Booleans are `true` or `false`; durations are milliseconds.
- Omit optional numbers to use defaults. Do not leave them empty.
- URLs require HTTPS except on localhost/loopback.
- Never commit credentials, customer data, card data, OTPs, or traces.

## Common target

| Variable             | Used by | Default / allowed      | Purpose                       |
| -------------------- | ------- | ---------------------- | ----------------------------- |
| `E2E_RUN_LABEL`      | B/S/G   | required               | Human-readable run label.     |
| `E2E_FE_URL`         | B/S/G   | required URL           | Frontend origin.              |
| `E2E_API_URL`        | B/S/G   | required URL           | API base including `/api/v1`. |
| `E2E_API_READY_PATH` | B/S/G   | `/health/ready`        | Readiness path.               |
| `E2E_EVENT_SLUG`     | B/S/G   | required               | Event slug.                   |
| `E2E_EVENT_TITLE`    | B/S/G   | required               | Exact expected title.         |
| `E2E_INVENTORY_MODE` | B/S/G   | B/S: `seated`; G: `ga` | Inventory flow.               |

## Booking only (B)

| Variable                     | Default / allowed | Purpose                                                     |
| ---------------------------- | ----------------- | ----------------------------------------------------------- |
| `E2E_EMAIL`                  | required email    | Login account.                                              |
| `E2E_PASSWORD`               | required          | Login password.                                             |
| `E2E_SEAT_LABEL`             | required          | Exact/preferred seat; `AUTO` only with `first-available`.   |
| `E2E_SEAT_SELECTION_MODE`    | `exact`           | `exact`, `preferred-or-first-available`, `first-available`. |
| `E2E_RECIPIENT_FULL_NAME`    | required          | Recipient name.                                             |
| `E2E_RECIPIENT_EMAIL`        | required email    | Recipient email.                                            |
| `E2E_RECIPIENT_COUNTRY_CODE` | required          | `+` plus 1–3 digits.                                        |
| `E2E_RECIPIENT_PHONE`        | required          | Phone without country code.                                 |
| `E2E_RECIPIENT_ID_PASSPORT`  | optional          | ID/passport.                                                |

## Contention users (S/G)

Replace `{A,B}` with `A` and `B`. Accounts and labels must differ.

| Variable                                    | Default / allowed           | Purpose                                        |
| ------------------------------------------- | --------------------------- | ---------------------------------------------- |
| `E2E_CUSTOMER_{A,B}_LABEL`                  | `Customer A` / `Customer B` | Window/evidence label; max 40 safe characters. |
| `E2E_CUSTOMER_{A,B}_EMAIL`                  | required email              | Login account.                                 |
| `E2E_CUSTOMER_{A,B}_PASSWORD`               | required                    | Login password.                                |
| `E2E_CUSTOMER_{A,B}_RECIPIENT_FULL_NAME`    | required                    | Winner recipient name.                         |
| `E2E_CUSTOMER_{A,B}_RECIPIENT_EMAIL`        | required email              | Winner recipient email.                        |
| `E2E_CUSTOMER_{A,B}_RECIPIENT_COUNTRY_CODE` | required                    | `+` plus 1-3 digits.                           |
| `E2E_CUSTOMER_{A,B}_RECIPIENT_PHONE`        | required                    | Phone without country code.                    |
| `E2E_CUSTOMER_{A,B}_RECIPIENT_ID_PASSPORT`  | optional                    | ID/passport.                                   |

Inventory:

| Variable               | Used by | Default / allowed    | Purpose                         |
| ---------------------- | ------- | -------------------- | ------------------------------- |
| `E2E_SEAT_LABEL`       | S       | required, not `AUTO` | Exact seat both users race for. |
| `E2E_TICKET_TYPE_NAME` | G       | required             | Exact GA ticket type name.      |
| `E2E_TICKET_TYPE_ID`   | G       | optional             | Extra name/ID check.            |
| `E2E_GA_QUANTITY`      | G       | `2`, range `1–100`   | Quantity each user races for.   |

## Completion and payment (B/S/G)

| Variable                    | Default / allowed | Purpose                                                                 |
| --------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `E2E_COMPLETION_MODE`       | required          | `reservation-only`, `mock-payment-success`, or `vnpay-sandbox-success`. |
| `E2E_PAYMENT_METHOD`        | conditional       | Empty / `mock` / `vnpay`, matching completion mode.                     |
| `E2E_VNPAY_SANDBOX_ORIGIN`  | VNPay only        | Must be `https://sandbox.vnpayment.vn`.                                 |
| `E2E_VNPAY_BANK_CODE`       | VNPay only        | Sandbox bank code.                                                      |
| `E2E_VNPAY_CARD_NUMBER`     | VNPay only        | Sandbox card number.                                                    |
| `E2E_VNPAY_CARDHOLDER_NAME` | VNPay only        | Sandbox cardholder.                                                     |
| `E2E_VNPAY_CARD_ISSUE_DATE` | VNPay only        | `MM/YY`.                                                                |
| `E2E_VNPAY_OTP`             | VNPay only        | Sandbox OTP.                                                            |

Valid mode/method pairs: `reservation-only` + empty,
`mock-payment-success` + `mock`, or `vnpay-sandbox-success` + `vnpay`
and all `E2E_VNPAY_*` values.

## Browser and timing

| Variable                      | B default | S/G default | Notes                             |
| ----------------------------- | --------: | ----------: | --------------------------------- |
| `E2E_NAVIGATION_TIMEOUT_MS`   |   `30000` |     `30000` | Positive integer.                 |
| `E2E_WAITROOM_TIMEOUT_MS`     |  `120000` |    `300000` | Positive integer.                 |
| `E2E_PAYMENT_TIMEOUT_MS`      |   `60000` |    `180000` | Positive integer.                 |
| `E2E_HEADLESS`                |   `false` |     `false` | `--headed` forces `false`.        |
| `E2E_SLOW_MO_MS`              |     `150` |       `750` | Non-negative; S/G max `10000`.    |
| `E2E_TICKET_DIALOG_REVIEW_MS` |    `5000` |     `10000` | Non-negative.                     |
| `E2E_TICKET_REVIEW_MS`        |   `10000` |     `10000` | Non-negative.                     |
| `E2E_DIAGNOSTIC_TRACE`        |   `false` |     `false` | Trace may contain sensitive data. |

Contention-only timing:

| Variable                             | Default | Allowed / purpose                    |
| ------------------------------------ | ------: | ------------------------------------ |
| `E2E_CONTENTION_GATE_TIMEOUT_MS`     | `30000` | `1–600000`; wait for both requests.  |
| `E2E_CONTENTION_RESULT_TIMEOUT_MS`   | `30000` | `1–600000`; wait for both responses. |
| `E2E_CONTENTION_MAX_RELEASE_SKEW_MS` |  `2000` | `1–10000`; max release skew.         |
| `E2E_CONTENTION_REVIEW_MS`           | `10000` | `0–600000`; result pause.            |
| `E2E_CONTENTION_TILE_WINDOWS`        |  `true` | Tile headed windows.                 |
| `E2E_CONTENTION_WINDOW_WIDTH`        |   `960` | `1–8000`.                            |
| `E2E_CONTENTION_WINDOW_HEIGHT`       |   `900` | `1–8000`.                            |

## Runner-managed variables

Do not put these in profile files:

| Variable                 | Set by | Purpose                                            |
| ------------------------ | ------ | -------------------------------------------------- |
| `E2E_PROFILE`            | B      | Booking fixture profile.                           |
| `E2E_CONTENTION_PROFILE` | S/G    | Contention fixture profile.                        |
| `E2E_RUN_ID`             | B/S/G  | Generated evidence directory ID.                   |
| `E2E_SUITE`              | S/G    | `seat-contention` or `ga-contention`.              |
| `E2E_KEEP_BROWSER_OPEN`  | B/S/G  | Set by `--keep-open`; videos finalize after close. |

`E2E_FAILURE_SCENARIO` is process-only for controlled B failure tests:
`invalid-credentials`, `active-checkout`, `waitroom-failure`,
`unavailable-seat`, or `unavailable-mock`.

CLI flags: `--profile <name>`, `--headed`, `--trace`, `--check`,
`--test`, `--keep-open`. `--check` and `--test` cannot be combined;
`--keep-open` is live-run only.

## GA inventory preparation

Backend command: `pnpm run loadtest:prepare-ga-contention-demo`.

| Variable                            | Default                  | Purpose                                          |
| ----------------------------------- | ------------------------ | ------------------------------------------------ |
| `GA_CONTENTION_API_CONTAINER`       | `backend_3001`           | Active API container.                            |
| `GA_CONTENTION_EVENT_SLUG`          | `ga-contention-demo`     | Target lowercase event slug.                     |
| `GA_CONTENTION_EVENT_NAME`          | `GA Contention Demo`     | New event name.                                  |
| `GA_CONTENTION_EVENT_CODE`          | `EVT-GA-CONTENTION-DEMO` | New event code.                                  |
| `GA_CONTENTION_TICKET_TYPE_NAME`    | `Final GA Batch`         | Use a new name after reservation history exists. |
| `GA_CONTENTION_TEMPLATE_EVENT_SLUG` | `river-food-festival`    | Existing non-seated template.                    |
| `GA_CONTENTION_QUANTITY`            | `2`, range `1–10`        | Capacity; normally equals `E2E_GA_QUANTITY`.     |

Database and Redis settings come from the API container; do not copy them into
frontend profiles.
