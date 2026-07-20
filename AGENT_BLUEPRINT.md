# Telos Backend — Slice Blueprint v2

> Supersedes `AGENT_FOUNDATION.md`. One agent implements ONE vertical slice
> against this blueprint. The shared foundation is frozen; you only ADD files
> inside your assigned package. Read top-to-bottom once, then work from §2
> (your assignment card) and §8 (gates).

---

## 0. Blueprint metadata

| Field              | Value                                                    |
|--------------------|----------------------------------------------------------|
| Version            | 2.0                                                      |
| Foundation frozen  | yes — see §3 for the exact frozen set                    |
| Stack              | Java 17 · Spring Boot 3.3.5 · Maven · package root `app.telos` |
| Database           | PostgreSQL 16 + PostGIS 3.5 @ `127.0.0.1:5433`, db/user/pass `telos`/`telos`/`telos` |
| Migrations         | Flyway `V1__schema.sql`, `V2__seed.sql`, `V3__chat.sql` (already applied on startup) |
| DDL policy         | `spring.jpa.hibernate.ddl-auto=validate` — entity fields MUST match columns |
| Build command      | `~/.local/bin/micromamba run -n telos mvn -B -q compile` (from repo root) |
| Smoke test         | `bash smoke-test.sh` against a running server on `:8080`  |
| Contract source    | `telos-frontend/docs/API_CONTRACTS.md` — authoritative for shapes |

If anything you observe in the repo contradicts this table, the repo wins —
and you MUST report the discrepancy in your summary (§9).

---

## 1. Operating rules (read before writing any code)

**R1 — Frozen foundation.** Never edit files under `domain/`, `repo/`,
`config/`, `security/`, `common/`, or `resources/db/migration/`. If your slice
seems to require it, STOP work on that endpoint and file a Blocker (§9.2).

**R2 — Additive only.** Create new files only under your assigned package(s).
Never modify another slice's package, even to "fix" it — file a Blocker.

**R3 — Contract is law.** Field names, JSON shapes, HTTP statuses, and error
codes must match the contract exactly. When the contract and your intuition
disagree, the contract wins. When the contract is silent, follow §6
conventions and note the assumption in your summary (§9.3).

**R4 — No new dependencies.** `pom.xml` is frozen. Everything you need is on
the classpath.

**R5 — No secrets/coordinates leakage.** Never serialize `item.geom`,
`user.homeGeom`, `passwordHash`, or raw JWT internals. See invariant I-1.

**R6 — Deterministic verification.** A slice is "done" only when every gate
in §8 passes. Compiling is gate 1 of 4, not done.

---

## 2. Slice assignment card (template)

Every slice assignment fills in this card. If you were not given a completed
card, request one before writing code.

```yaml
slice: <name>                     # e.g. wallet
packages:                         # the ONLY places you may create files
  - app.telos.<slice>             # controller (+ optional .web)
  - app.telos.<slice>.service     # services
  - app.telos.<slice>.dto         # request/response records
endpoints:                        # one entry per route
  - method: GET|POST|PATCH|DELETE
    path: /api/...
    auth: public | user | admin
    request: <record name or "none">
    response: <record name>
    success: <2xx status>
    errors:                       # every non-2xx you must produce
      - {status: 404, code: NOT_FOUND, when: "..."}
      - {status: 409, code: ILLEGAL_TRANSITION, when: "..."}
invariants: [I-1, I-2, ...]       # from §5 — the ones your slice must uphold
touches-money: yes|no             # yes ⇒ I-2..I-4 apply, @Transactional required
emits-notifications: yes|no      # yes ⇒ follow §6.2
smoke-sections: [<names>]         # which smoke-test.sh sections cover you
```

---

## 3. Frozen foundation — the exact surface you build on

### 3.1 Enums — `app.telos.domain.enums`

| Enum | Values |
|---|---|
| `TxState` | AVAILABLE, REQUESTED, APPROVED, ACTIVE, RETURNED, DECLINED, CANCELLED, OVERDUE |
| `Mode` | RENT, BORROW, BUY |
| `KycStatus` | PENDING, VERIFIED, REJECTED |
| `LedgerType` | ESCROW_LOCK, DEPOSIT_RELEASE, PAYOUT, TOPUP, PENALTY |
| `LedgerStatus` | LOCKED, CLEARED, PENDING |
| `Role` | BORROWER, LENDER *(per-viewer transaction role)* |
| `VerificationKind` | KYC, RECEIPT |
| `VerificationStatus` | PENDING, APPROVED, REJECTED |
| `NotificationType` | REQUEST, APPROVED, OVERDUE, RETURNED |

### 3.2 Entities — `app.telos.domain.entity` (getters/setters, no Lombok)

| Entity (table) | Fields |
|---|---|
| `User` | id, name, email, passwordHash, neighborhood, joined:LocalDate, rating, reviews, verified, kycStatus, admin:boolean, homeGeom:Point |
| `Item` | id, title, category, ownerId, mode, state, price, deposit, geom:Point, vicinity, description, specs:List\<String\>, rating, reviews, image |
| `Transaction` (`tx`) | id, itemId, itemTitle, borrowerId, lenderId, mode, state, fee, deposit, days, lateFee:Double, createdAt:Instant, dueAt:Instant, returnedAt:Instant, coordsUnlocked:boolean |
| `Wallet` | userId, available, locked, earned, pendingClear, version *(one per user; `version` is optimistic-lock)* |
| `LedgerEntry` | id, userId, type, label, amount:double *(signed)*, at:Instant, status, txId |
| `Notification` | id, userId, type, text, at:Instant, unread:boolean |
| `Verification` | id, kind, userId, submittedAt:Instant, amount:Double, doc, status, ledgerId |

### 3.3 Repositories — `app.telos.repo`

| Repository | Custom methods |
|---|---|
| `UserRepository` | `findByEmail`, `existsByEmail` |
| `ItemRepository` | `findWithinRadius(Point viewer, double radiusMeters, String mode, String category)` → `List<Object[]>` rows of `[id:String, distanceKm:Double]`; `findByOwnerId` |
| `TransactionRepository` | `findByBorrowerIdOrLenderId`, `findByStateAndDueAtBefore`, `existsByItemIdAndBorrowerIdAndStateIn` |
| `WalletRepository` | standard `JpaRepository<Wallet,String>` |
| `LedgerEntryRepository` | `findByUserIdOrderByAtDesc` |
| `NotificationRepository` | `findByUserIdOrderByAtDesc`, `countByUserIdAndUnreadTrue`, `markAllRead(userId)` |
| `VerificationRepository` | `findByStatusOrderBySubmittedAtDesc`, `findAllByOrderBySubmittedAtDesc`, `countByStatus` |

### 3.4 Security — `app.telos.security` / `app.telos.config`

- JWT Bearer auth. `JwtAuthFilter` puts the **userId string** as the
  SecurityContext principal with authority `ROLE_ADMIN` or `ROLE_USER`.
- Inject `CurrentUser`: `currentUser.id()` → authenticated userId;
  `currentUser.isAdmin()` → boolean.
- Inject `TokenService`: `issue(userId, email, admin)` → JWT;
  `verify(token)` → `TokenService.Principal(userId, email, admin)`.
- A BCrypt `PasswordEncoder` bean is injectable.
- Route rules are ALREADY configured — you never touch `SecurityConfig`:
  - public: `/api/auth/login`, `/api/auth/signup`, `/api/categories`
  - `ROLE_ADMIN`: `/api/admin/**`
  - everything else: any authenticated user

### 3.5 State machine — `app.telos.domain.StateMachine`

- `canTransition(from, to)` → boolean — **always guard PATCHes with this**
- `nextStates(from)` → `List<TxState>`
- `isTerminal(state)` → boolean
- `LIFECYCLE` → the happy-path list

### 3.6 Errors — `app.telos.common` (JSON-mapped by `GlobalExceptionHandler`)

| Throw | Wire result |
|---|---|
| `NotFoundException(msg)` | `404 {"error":"NOT_FOUND","message":…}` |
| `IllegalTransitionException(from,to)` | `409 {"error":"ILLEGAL_TRANSITION","from":…,"to":…}` |
| `BusinessException(status, code, msg)` | `<status> {"error":code,"message":…}` — e.g. `new BusinessException(HttpStatus.GONE, "TOKEN_EXPIRED", "…")` |

Never build error JSON by hand; always throw one of these.

---

## 4. Existing slices (do not touch; use as living examples)

`auth`, `user`, `item`, `transaction`, `wallet`, `handoff`, `admin`,
`notification`, `chat`. When unsure how to structure a controller/service/DTO,
open the closest existing slice and mirror it. `transaction` is the canonical
example for money + state-machine work; `chat` for pagination/list shapes.

---

## 5. Cross-cutting invariants (each card lists which apply)

- **I-1 Coordinate & credential privacy.** Responses NEVER contain `geom`,
  `homeGeom`, or `passwordHash`. Items expose only `offset{x,y}` (km),
  `vicinity`, `distanceKm`, `coordsUnlocked`. Discovery always reports
  `coordsUnlocked:false`; detail flips it `true` only for the owner or a
  viewer with a non-PENDING transaction on the item.
- **I-2 Escrow atomicity.** Any money movement (lock, release, payout, topup,
  penalty) happens inside one `@Transactional` service method that updates the
  `Wallet` AND writes the matching `LedgerEntry`. Never one without the other.
- **I-3 Wallet arithmetic.** `available` never goes negative — reject with
  `BusinessException(HttpStatus.CONFLICT, "INSUFFICIENT_FUNDS", …)` before
  mutating. Ledger `amount` is signed: debits negative, credits positive.
- **I-4 State machine is authoritative.** Every `Transaction.state` change
  goes through `StateMachine.canTransition`; on failure throw
  `IllegalTransitionException(from, to)`. Never set state directly from input.
- **I-5 Ownership checks.** A user may only act on resources they own or are
  party to (borrower/lender). Wrong-user access to an existing resource is
  `404 NOT_FOUND` (don't leak existence), except where the contract specifies
  `403`.
- **I-6 Idempotent reads.** GET endpoints never mutate state (no read-time
  side effects such as marking notifications read).

---

## 6. Conventions

1. **DTOs** are Java `record`s in `app.telos.<slice>.dto`. Controllers return
   DTOs, never entities.
2. **Layout**: controller in `app.telos.<slice>` (or `.web`), services in
   `.service`. Constructor injection only.
3. **`@Transactional`** on every service method that mutates; none on pure reads.
4. **Time** is ISO-8601 UTC `Instant`, serialized as-is by Jackson.
5. **Money** is `double` dollars. Round to cents only where the contract says.
6. **IDs** are `String`; generate with the same scheme the neighboring slices
   use (check an existing service before inventing one).
7. **Validation**: annotate request records (`@NotBlank`, `@Positive`, …) and
   `@Valid` them in the controller; let the global handler shape the 400.
8. **Naming**: `XxxController`, `XxxService`, request records `XxxRequest`,
   responses `XxxDto` / `XxxResponse` — match the existing slices.

### 6.1 Response shape examples (canonical)

```jsonc
// error (from GlobalExceptionHandler — never hand-rolled)
{ "error": "ILLEGAL_TRANSITION", "from": "RETURNED", "to": "ACTIVE" }

// item in a discovery list (note: no coordinates, coordsUnlocked always false)
{ "id": "i7", "title": "Impact driver", "mode": "RENT", "price": 8.0,
  "deposit": 40.0, "vicinity": "Maple & 3rd", "distanceKm": 1.2,
  "offset": { "x": -0.4, "y": 1.1 }, "coordsUnlocked": false }
```

### 6.2 Notifications (if `emits-notifications: yes`)

Write a `Notification` row (type from `NotificationType`, `unread:true`,
`at:Instant.now()`) to the OTHER party inside the same transaction as the
triggering mutation. Text style: short, human, present tense — copy the tone
of existing rows in `V2__seed.sql`.

---

## 7. Workflow (do these in order)

1. **Read** your assignment card (§2) and the matching section of
   `telos-frontend/docs/API_CONTRACTS.md`.
2. **Survey** the two nearest existing slices (§4) for idiom.
3. **Design** DTO records first, straight from the contract JSON.
4. **Implement** service(s), then controller(s). Guard invariants (§5) at the
   service layer, not the controller.
5. **Self-review** against the card: every endpoint, every error row, every
   invariant listed.
6. **Run the gates** (§8).
7. **Write the summary** (§9).

---

## 8. Verification gates (all must pass — in order)

| # | Gate | Command / check | Pass condition |
|---|---|---|---|
| G1 | Compile | `~/.local/bin/micromamba run -n telos mvn -B -q compile` | exit 0, no warnings introduced |
| G2 | Scope diff | `git status --porcelain` (or file listing) | ONLY new files, ONLY under your packages |
| G3 | Contract audit | re-read your card vs. your controllers | every endpoint/status/error present, no extras |
| G4 | Smoke test | start server, `bash smoke-test.sh` | your `smoke-sections` all ✓; no previously-passing section regresses |

If G4 can't run (server can't start for reasons outside your slice), say so
explicitly in the summary — do not silently skip it.

---

## 9. Reporting protocol

End your run with exactly these three sections:

### 9.1 Delivered
Endpoint-by-endpoint list: `METHOD path → status` plus the gate results
(G1–G4, pass/fail/skipped-with-reason).

### 9.2 Blockers
Anything that required touching frozen files, another slice, `pom.xml`, or the
DB schema. State WHAT you needed, WHY, and what you did instead (usually:
omitted the endpoint). An honest blocker beats a rule-breaking workaround —
always.

### 9.3 Assumptions
Every place the contract was silent and you chose. One line each:
`<endpoint> — <assumption> — <why>`.

---

## 10. Blueprint changelog

| Version | Change |
|---|---|
| 2.0 | Restructured as blueprint: assignment-card template (§2), numbered invariants (§5), 4-gate verification (§8), 3-part reporting protocol (§9), tabled foundation surface (§3), added `chat` slice + V3 migration, canonical response examples (§6.1), notification convention (§6.2). |
| 1.x | `AGENT_FOUNDATION.md` — prose brief. |
