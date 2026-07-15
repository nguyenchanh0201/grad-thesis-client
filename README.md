# Grad Thesis Ticketing Frontend

NextJS frontend for event discovery, queue admission, ticket selection, reservation information, payment, tickets, and organizer flows.

## Stack

- NextJS App Router
- React 19
- TanStack Query
- Zustand
- Zod
- Axios with retry and contract parsing
- Tailwind CSS

## Source Layout

- `app`: routes and local API routes.
- `components`: booking, queue, payment, event, organizer, shared UI.
- `hooks`: React Query hooks and flow hooks.
- `services`: HTTP service layer.
- `schemas`: Zod runtime API contracts.
- `lib`: API client, stores, booking session helpers, payment helpers, utilities.

## Integration Rules

- Keep HTTP calls in `services/*`.
- Keep response validation in `schemas/*`.
- Keep components consuming hooks/stores.
- Treat Zustand, cookies, and sessionStorage as temporary UX state only.
- Backend remains authoritative for queue admission, reservation ownership, capacity, payment, and ticket issuance.
- Preserve waitroom token propagation into reservation and payment calls.

## Local Setup

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Set `NEXT_PUBLIC_API_URL` to the backend API prefix, for example:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Verification

```bash
pnpm lint
pnpm build
```

## Demo Readiness

Before payment or booking changes, read:

- `../.codex/AGENTS.md`
- `../.codex/memory/demo-readiness-audit.md`
- `../.codex/memory/frontend-backend-integration.md`
- `../.codex/workflows/booking-flow-change.md`
- `../.codex/workflows/payment-change.md`

Current highest-risk areas:

- Queue heartbeat currently stops after redirect to ticket selection.
