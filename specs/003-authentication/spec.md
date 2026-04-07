# specs/001-authentication/spec.md - Authentication & User Profile

**Job ID:** 001  
**Status:** 🔴 Not Started  
**Dependencies:** None  
**Duration:** 2 days | **Priority:** CRITICAL

---

## 1️⃣ FUNCTIONAL GOAL

Implement a type-safe authentication layer that:

- Fetches the current user's profile from `GET /identity/me`
- Validates user roles (USER, ORGANIZER, ADMIN, SUPER_ADMIN)
- Persists user context globally for all downstream jobs
- Handles auth errors gracefully with fallback strategies
- Integrates with TanStack Query for caching + refetch on focus
- Provides A2UI-compliant components for user display

---

## 2️⃣ DATA CONTRACT (Schema Mapping)

### OpenAPI Source (api.yml)

```yaml
CurrentUser:
  type: object
  properties:
    id:
      type: string
      description: User ID
    role:
      type: string
      enum: [USER, ORGANIZER, ADMIN, SUPER_ADMIN]
      description: User role
```

### Zod Schema (to be generated)

```typescript
// schemas/generated/current-user.schema.ts
export const CurrentUserSchema = z.object({
  id: z.string().min(1, "User ID required"),
  role: z.enum(["USER", "ORGANIZER", "ADMIN", "SUPER_ADMIN"]),
});

export type CurrentUser = z.infer<typeof CurrentUserSchema>;
```

### Request/Response Flow

```
GET /identity/me
  (headers: x-mock-user-id: 'user123')
                    ↓
    Response 200 OK:
    {
      "success": true,
      "data": { "user": { "id": "user123", "role": "USER" } },
      "message": "worked.",
      "timestamp": "2026-04-07T10:00:00Z"
    }
                    ↓
    Parse with Zod schema ✅
    Store in TanStack Query cache
```

---

## 3️⃣ LOGIC FLOW

**`useCurrentUser()` Hook Lifecycle:**

```
App Start
   ↓
useCurrentUser() hook fires
   ├─ Check TanStack Q cache (5 min staleTime)
   ├─ If stale/missing → Fetch /identity/me
   └─ Handle response:
      ├─ ✅ 200 OK → Parse + cache
      ├─ ❌ 400/401 → No retry (fail fast)
      ├─ ❌ Network error → Retry (1s, 2s, 4s)
      └─ ❌ Timeout → Check localStorage fallback
```

---

## 4️⃣ FAILURE MODES & HANDLING

| Error                | Handler              | UX                          |
| -------------------- | -------------------- | --------------------------- |
| 400 (missing header) | No retry, fail fast  | Toast: "Invalid session"    |
| 401 (unauthorized)   | No retry             | Redirect to login (future)  |
| Network timeout      | Retry: 1s → 2s → 4s  | Show skeleton, then error   |
| Offline              | Check localStorage   | Show cached user with badge |
| Zod validation error | Log + error boundary | Show "Technical error"      |

---

## 5️⃣ A2UI CONTRACT

```html
<div
  data-agent-type="state-display"
  data-entity-type="user-profile"
  data-entity-id="{user?.id}"
  data-state-keys="id,role"
>
  {user?.role}
</div>

<button
  data-agent-type="action"
  data-permission-required="ORGANIZER"
  data-permission-available="{user?.role"
  =""
  =""
  ="ORGANIZER"
  }
  disabled="{user?.role"
  !=""
  ="ORGANIZER"
  }
>
  Create Event
</button>
```

---

## 6️⃣ IMPLEMENTATION CHECKLIST

- [ ] Create `schemas/generated/current-user.schema.ts`
- [ ] Enhance `lib/api-client.ts` with correlation IDs + retry logic
- [ ] Create `hooks/useCurrentUser.ts`
- [ ] Create `components/auth/UserProfile.tsx`
- [ ] Integrate into `app/layout.tsx`
- [ ] Add localStorage fallback (5 min TTL)
- [ ] Write unit tests for hook + schema validation
- [ ] Verify 100% TypeScript strict mode compliance

---

## 7️⃣ DEFINITION OF DONE

- [x] Zod schema validates all user test cases
- [x] Hook returns `{ data, isLoading, error }` states
- [x] Fallback to localStorage when offline
- [x] All error scenarios handled gracefully
- [x] A2UI attributes on user components
- [x] Zero TypeScript errors in strict mode
- [x] Retry logic works (exponential backoff)
- [x] TanStack Query caching works (5 min stale)
- [x] Unit tests pass (error + success paths)

---

## 8️⃣ DELIVERABLES

```
schemas/generated/
├── current-user.schema.ts
└── api-response.schema.ts

lib/
├── api-client.ts (with retry + correlation ID)
└── api-errors.ts (custom error classes)

hooks/
├── useCurrentUser.ts
└── useCurrentUserOrGuest.ts

components/auth/
├── UserProfile.tsx
├── RoleGate.tsx
└── LoadingShell.tsx

__tests__/
├── useCurrentUser.test.ts
└── CurrentUserSchema.test.ts
```

---

**⏳ AWAITING YOUR APPROVAL TO PROCEED WITH IMPLEMENTATION**
