# Customer Booking E2E Commands

```powershell
pnpm install
```

Installs the frontend dependencies required by the Playwright runner.

```powershell
pnpm exec playwright install chromium
```

Installs the Chromium browser used by the customer journey.

```powershell
Set-Location ..\grad_thesis_server
docker compose --env-file .env.development up -d --build nginx backend-worker backend-scheduler
```

Builds and starts the core backend API, worker, scheduler, PostgreSQL, Valkey, SuperTokens, Elasticsearch, and nginx services.

```powershell
pnpm run docker:up
```

Optionally rebuilds the stack and destructively resets and reseeds demo data when a fresh database is required.

```powershell
docker compose --env-file .env.development ps
curl.exe -f http://localhost:5004/api/v1/health/ready
docker exec backend_3001 printenv VNP_RETURN_URL
```

Checks container health, API readiness, and the browser-facing VNPay return target.

```powershell
Set-Location ..\grad-thesis-client
pnpm run dev
```

Starts the frontend on port 3000 and keeps this terminal occupied while the demo runs.

```powershell
Copy-Item e2e\profiles\local.example.env e2e\profiles\local.env
```

Creates an ignored local profile that can be edited with the target URLs and customer account.

```powershell
pnpm run e2e:booking:check -- --profile local
```

Validates the profile and checks frontend/API readiness without opening a browser or creating a reservation.

```powershell
pnpm run e2e:booking -- --profile local --headed
```

Runs the configured customer booking workflow in a visible browser and closes it after verification.

```powershell
pnpm run e2e:booking -- --profile local --headed --keep-open
```

Runs the configured customer workflow and keeps the verified final page open until the browser is closed normally.

```powershell
pnpm run e2e:booking:test -- --profile local
```

Runs the Playwright scenario selected by the profile for controlled regression verification.

```powershell
pnpm exec vitest run e2e
```

Runs the fast unit tests for profile parsing, page objects, failure classification, and evidence handling.

```powershell
Set-Location ..\grad_thesis_server
$env:BASE_URL='http://localhost:5004'
$env:LOAD_TEST_USER_COUNT='601'
$env:LOAD_TEST_USER_PREFIX='spike-user'
$env:LOAD_TEST_USER_PASSWORD='<test-password>'
$env:LOAD_TEST_SESSION_FILE='load-tests/.generated/spike-sessions.json'
pnpm run loadtest:prepare-users
```

Creates 601 isolated authenticated test sessions for the staged waitroom demonstration.

```powershell
Set-Location ..\grad-thesis-client
Copy-Item e2e\profiles\spike.example.env e2e\profiles\spike.env
```

Creates an ignored browser profile for user 601 that must use the same test password as the prepared sessions.

```powershell
Set-Location ..\grad_thesis_server
k6 run load-tests/k6/waitroom-active-hold.js
```

Fills the 500 active waitroom slots without creating reservations, payments, orders, or tickets.

```powershell
k6 run load-tests/k6/waitroom-queue-progress-demo.js
```

Runs 500 active users plus 100 queued users and releases active sessions in waves for visible queue progression.

```powershell
Set-Location ..\grad-thesis-client
pnpm run e2e:booking -- --profile spike --headed --keep-open
```

Runs browser user 601 behind the staged queue, completes VNPay sandbox payment, and keeps the final verified ticket page visible.

```powershell
$runId='<run-id>'
pnpm exec playwright show-report "test-results\customer-booking\$runId\playwright-report"
```

Opens the HTML report for a completed customer-booking run.
