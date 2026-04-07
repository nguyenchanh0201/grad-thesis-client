# specs/plan.md - Master Implementation Roadmap

**Status:** Execution Phase - Job 001 Complete  
**Total Jobs:** 8 | **Priority Sequence:** Sequential (dependencies tracked)  
**Delivery Target:** Modular Frontend for Event Ticketing System

---

## 🗺️ JOB ROADMAP (Foundation-First Execution)

### **JOB 001: UI Foundation & Design System**

**Status:** ✅ Completed | **Dependency:** None  
**Priority:** CRITICAL (all UI jobs depend on tokens/primitives)  
**Duration Estimate:** 1 day  
**Scope:**

- Tailwind v4 `@theme` tokens and OKLCH palette
- shadcn/ui color mapping and radius/shadow overrides
- Font loading and variable font setup
- Base primitives: Button, Card, Input, Badge, Dialog, Toast
- A2UI attributes on foundational components
- Hover/active/focus micro-interactions
  **Failure Modes:**
- Color mismatch → Fix tokens in one place only
- Font loading shift → Use `next/font` variable strategy
- Generic shadcn appearance → Override base theme variables
  **Definition of Done:**
- [x] OKLCH token set applied globally
- [x] shadcn/ui matches the branded theme
- [x] Fonts load without CLS
- [x] Base primitives share consistent radius/shadows
      **Spec File:** `specs/001-foundation/spec.md` ✅ (`specs/001-foundation/qa-report.md`)

---

### **JOB 002: Schema Generation & API Client**

**Status:** 🔴 Not Started | **Dependency:** 001  
**Priority:** CRITICAL (shared contract enforcement)  
**Duration Estimate:** 2 days  
**Scope:**

- Auto-generate Zod schemas from api.yml (30+ domains)
- Type-safe API client wrapper (axios + correlation ID)
- Implement error handling: 409 (conflict), 500 (server), timeout
- Retry strategy: exponential backoff (1s, 2s, 4s, 8s, 16s max)
- Request/response interceptors for logging + tracing
- Mock server adapter for development
  **Artifacts:**
- `schemas/generated/` (auto-generated Zod)
- `lib/api-client.ts` (refactored with interceptors)
- `lib/api-errors.ts` (custom error classes)
- `lib/retry-strategy.ts` (exponential backoff)
  **Definition of Done:**
- [ ] All 30+ schemas compile without errors
- [ ] Zero TypeScript errors
- [ ] Mock API works in dev mode
- [ ] Retry logic tested with network failures
      **Spec File:** `specs/002-schemas/spec.md` ⏳

---

### **JOB 003: Authentication & User Profile**

**Status:** 🔴 Not Started | **Dependency:** 001, 002  
**Priority:** CRITICAL (shared user context)  
**Duration Estimate:** 2 days  
**Scope:**

- API endpoint: `GET /identity/me` (CurrentUser schema)
- Zod schema validation for user roles (USER, ORGANIZER, ADMIN, SUPER_ADMIN)
- Mock auth header handling (x-mock-user-id, x-mock-role)
- TanStack Query hook: useCurrentUser()
- Error handling: 400 (missing header), 401 (invalid)
- A2UI semantics for user context display
  **Failure Modes:**
- Network failure → Fallback to localStorage cached user
- Invalid role → Show permission denied UI
- Session timeout → Redirect to login
  **Definition of Done:**
- [ ] Zod schema matches OpenAPI CurrentUser
- [ ] useCurrentUser() hook works with refetch on focus
- [ ] User role persisted and accessible globally
- [ ] 100% TypeScript coverage (no `any` types)
      **Spec File:** `specs/003-authentication/spec.md` ⏳

---

### **JOB 004: Event Catalog Page**

**Status:** 🔴 Not Started | **Dependency:** 001, 002, 003  
**Priority:** HIGH (primary user journey starts here)  
**Duration Estimate:** 3 days  
**Scope:**

- List all events: `GET /catalog/events`
- Search/filter: category, date range, price range, venue
- Pagination: TanStack Query integration
- Event card component with image, price range, sale dates
- Skeleton loading state (150ms min duration)
- "Sold Out" vs. "On Sale" vs. "Coming Soon" states
- A2UI attributes for agent introspection
  **Pagespecs:**
- `app/events/page.tsx` (list with search)
- `app/events/[id]/page.tsx` (detail view, seat map preview)
- `components/events/EventCard.tsx`
- `components/events/EventSearchBar.tsx`
- `components/events/SeatMapPreview.tsx`
- `hooks/useEventList.ts` (TanStack Query wrapper)
  **Failure Modes:**
- No events found → Show "No events" message
- API timeout → Retry with exponential backoff
- Invalid event ID → 404 page
  **Definition of Done:**
- [ ] Events render with all fields from schema
- [ ] Search works with query params
- [ ] Pagination works (page, limit params)
- [ ] Skeleton loading shows for 150-500ms
- [ ] All A2UI attributes present
      **Spec File:** `specs/004-event-catalog/spec.md` ⏳

---

### **JOB 005: Wait Room (Queue Management)**

**Status:** 🔴 Not Started | **Dependency:** 001, 002, 003  
**Priority:** CRITICAL (high-concurrency bottleneck)  
**Duration Estimate:** 4 days  
**Scope:**

- Entry flow: User clicks "Get Tickets" → POST /waitroom/enter
- Queue status polling: GET /waitroom/status with heartbeat
- States: NOT_OPEN → QUEUEING → ADMITTED → LOST_SESSION
- Position display (if QUEUEING): "You are #234 in queue"
- Estimated wait time calculation
- Heartbeat mechanism: every 5 seconds to maintain session TTL
- Zombie session recovery: detect LOST_SESSION → show recovery UI
- Optimistic UI: Animate transitions smoothly
  **Components:**
- `components/waitroom/WaitRoomLoader.tsx` (entry trigger)
- `components/waitroom/QueueStatus.tsx` (position display)
- `components/waitroom/HeartbeatManager.tsx` (side effect hook)
- `hooks/useWaitroom.ts` (TanStack Query + polling)
- `hooks/useHeartbeat.ts` (session maintenance)
  **Failure Modes:**
- LOST_SESSION → Show "Session expired, rejoin queue"
- Heartbeat fails → Queue for recovery
- User closes tab → Session cleanup
  **Definition of Done:**
- [ ] Heartbeat fires every 5s
- [ ] State transitions animate smoothly
- [ ] LOST_SESSION recovery works
- [ ] No memory leaks (cleanup on unmount)
- [ ] Idempotency: heartbeat retry-safe
      **Spec File:** `specs/005-waitroom/spec.md` ⏳

---

### **JOB 006: Seat Selection & Reservation**

**Status:** 🔴 Not Started | **Dependency:** 001, 002, 003, 004, 005  
**Priority:** CRITICAL (core booking flow)  
**Duration Estimate:** 4 days  
**Scope:**

- Load seat map: `GET /catalog/events/{id}/seat-map`
- Render interactive seat grid with sections
- Seat states: AVAILABLE (clickable), HELD (grayed), SOLD (disabled), RESERVED (user's pick)
- Click to reserve: `POST /catalog/events/{id}/seats/{seatId}/reserve`
- Optimistic UI: Show reserved immediately, rollback on 409
- Best available: `POST /catalog/events/{id}/seats/best-available` (auto-pick)
- Cart state: TanStack Query mutation
- Price display: Dynamic based on quality tier + section
  **Components:**
- `components/seats/SeatMap.tsx`
- `components/seats/SeatRow.tsx`
- `components/seats/Seat.tsx`
- `components/seats/CartSummary.tsx`
- `hooks/useSeatReservation.ts`
  **Error Handling:**
- 409 Conflict → Show toast "Seat sold out, pick another"
- 500 Error → Exponential backoff retry
- Timeout → Show retry button
  **Definition of Done:**
- [ ] Seat map renders 100+ seats without lag
- [ ] Optimistic UI reserves instantly
- [ ] 409 rollback animation smooth
- [ ] A2UI attributes on every seat
- [ ] Cart persists via URL query params
      **Spec File:** `specs/006-seats/spec.md` ⏳

---

### **JOB 007: Checkout & Payment**

**Status:** 🔴 Not Started | **Dependency:** 001, 002, 003, 005, 006  
**Priority:** CRITICAL (revenue flow)  
**Duration Estimate:** 3 days  
**Scope:**

- Confirm reserved seats + total price
- User details form: Holder names (Zod validated)
- Idempotency key generation: SHA256(eventId + seatIds + userId)
- VNPay payment gateway: `POST /payment/vnpay/create-url`
- Payment status polling: `GET /payment/status?transactionId`
- Success: Show order confirmation + ticket details
- Failure: Show "Payment failed, try again"
- Order history: `GET /user/orders` (TanStack Query)
  **Components:**
- `components/checkout/OrderSummary.tsx`
- `components/checkout/HolderForm.tsx`
- `components/checkout/PaymentButton.tsx`
- `components/checkout/PaymentStatus.tsx`
- `components/checkout/OrderConfirmation.tsx`
  **Failure Modes:**
- VNPay connection lost → Show "Payment service unavailable"
- Duplicate payment → Redis cache prevents double-charge
- Network timeout → Idempotency key retry
  **Definition of Done:**
- [ ] Form validates all fields before submit
- [ ] Idempotency key prevents double-charge
- [ ] Payment polling updates status live
- [ ] Order confirmation shows ticket QR codes
- [ ] Order history persists
      **Spec File:** `specs/007-checkout/spec.md` ⏳

---

### **JOB 008: User Ticket Dashboard**

**Status:** 🔴 Not Started | **Dependency:** 001, 002, 003, 007  
**Priority:** MEDIUM (user convenience)  
**Duration Estimate:** 2 days  
**Scope:**

- List user tickets: `GET /user/tickets` (paginated)
- Ticket detail modal: status, seat info, QR code
- Ticket transfer: `POST /user/tickets/{id}/transfer`
- Ticket check-in: Scanner integration (Phase 2)
- Ticket history: Shows VALID, USED, CANCELLED, TRANSFERRED states
- Export to calendar: iCal format
  **Components:**
- `components/tickets/TicketCard.tsx`
- `components/tickets/TicketDetail.tsx`
- `components/tickets/TicketTransfer.tsx`
- `components/tickets/TicketHistory.tsx`
  **Definition of Done:**
- [ ] All ticket states render correctly
- [ ] QR code generation works
- [ ] Transfer form validated with Zod
- [ ] Pagination works for 100+ tickets
      **Spec File:** `specs/008-tickets/spec.md` ⏳

---

## 📊 DEPENDENCY GRAPH

```
001: Foundation
   ├─ 002: Schemas/API Client
   │   └─ 003: Auth
   │       ├─ 004: Events
   │       │   └─ 006: Seats
   │       │       └─ 007: Checkout
   │       │           └─ 008: Tickets
   │       └─ 005: Wait Room
   └─ shared primitives for all feature jobs
```

---

## ✅ QUALITY GATES

- [ ] TypeScript strict mode: zero errors
- [ ] All Zod schemas validate correctly
- [ ] A2UI attributes present on interactive elements
- [ ] Responsive: mobile, tablet, desktop
- [ ] Accessibility: WCAG AA compliance
- [ ] Performance: Lighthouse > 80
- [ ] No console warnings
- [ ] Unit tests for business logic

---

## 📌 NEXT STEP

Proceed to `specs/001-foundation/spec.md` for the revised first job.
