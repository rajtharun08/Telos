# Telos Backend — Complete Technical Overview

This document explains the entire `telos-backend` codebase: architecture, domain
model, every endpoint and its business logic, the database schema and seed
data, security model, configuration, and known gaps. It reflects the code as
it stands after the invariant-compliance audit and fixes applied in this
session (ownership checks, escrow/ledger correctness, validation, and the
I-6 read/mutate split — see §12).

---

## 1. What this service is

Telos is a hyperlocal P2P sharing-economy app (rent/borrow/buy items with
neighbors). This backend is a Spring Boot + PostgreSQL/PostGIS REST API that
replaces the frontend's in-memory mock data layer with a real database,
real geospatial radius search, real JWT auth, and a real (if simplified)
escrow/ledger money system.

**Stack**
- Java 17, Spring Boot 3.3.5 (Web, Data JPA, Security, Validation)
- PostgreSQL 16 + PostGIS 3.5, mapped via `hibernate-spatial`
- Flyway for schema + seed migrations
- JWT bearer auth, HS256, dev-issued (Firebase swap-in seam documented but
  not implemented)
- Maven build, package root `app.telos`

---

## 2. Package layout

```
app.telos
├── TelosBackendApplication.java   @SpringBootApplication, @EnableScheduling
├── domain
│   ├── entity/        User, Item, Transaction, Wallet, LedgerEntry,
│   │                  Notification, Verification, Message
│   ├── enums/         TxState, Mode, KycStatus, LedgerType, LedgerStatus,
│   │                  Role, VerificationKind, VerificationStatus,
│   │                  NotificationType
│   └── StateMachine.java   server-authoritative transition guard
├── repo/               Spring Data JPA repositories (+ native PostGIS query)
├── security/           TokenService, DevJwtTokenService, CurrentUser
├── config/             SecurityConfig, JwtAuthFilter, DevDataInitializer
├── common/             BusinessException, NotFoundException,
│                       IllegalTransitionException, GlobalExceptionHandler
├── auth/               POST /api/auth/login|signup|logout, GET /api/me
├── user/               GET /api/users/{id}
├── item/               GET/POST /api/items, GET /api/items/{id}, /api/categories
├── transaction/        GET/POST /api/transactions, PATCH /api/transactions/{id}
├── wallet/             GET /api/wallet, POST /api/wallet/topups
├── handoff/            POST /api/handoff/{txId}/token, POST /api/handoff/scan
├── admin/              GET /api/admin/verifications, PATCH …/{id}, GET …/metrics
├── notification/       GET /api/notifications, PATCH /api/notifications/read
└── chat/               GET /api/chats[/{txId}], PATCH …/read, POST …/messages
```

Every slice follows the same internal shape: `XxxController` (thin, maps
`CurrentUser` → service calls), `XxxService` (`@Transactional` business
logic), `dto/` (request/response `record`s — controllers never return
entities directly, which is what keeps `geom`/`homeGeom`/`passwordHash` from
ever leaking into JSON).

---

## 3. Domain model

### 3.1 Enums (`domain.enums`)

| Enum | Values |
|---|---|
| `TxState` | `AVAILABLE, REQUESTED, APPROVED, ACTIVE, RETURNED, DECLINED, CANCELLED, OVERDUE` |
| `Mode` | `RENT, BORROW, BUY` |
| `KycStatus` | `PENDING, VERIFIED, REJECTED` |
| `LedgerType` | `ESCROW_LOCK, DEPOSIT_RELEASE, PAYOUT, TOPUP, PENALTY` |
| `LedgerStatus` | `LOCKED, CLEARED, PENDING` |
| `Role` | `BORROWER, LENDER` (per-viewer, not stored — derived at read time) |
| `VerificationKind` | `KYC, RECEIPT` |
| `VerificationStatus` | `PENDING, APPROVED, REJECTED` |
| `NotificationType` | `REQUEST, APPROVED, OVERDUE, RETURNED` |

### 3.2 Entities (`domain.entity`)

Plain JPA entities, manual getters/setters, no Lombok.

- **`User`** (`app_user`) — id, name, email (unique), passwordHash (nullable —
  seeded neighbors who never log in have none), neighborhood, joined,
  rating, reviews, verified, kycStatus, admin, `homeGeom` (`geography(Point,4326)`,
  **server-only, never serialized**).
- **`Item`** (`item`) — id, title, category, ownerId, mode, state (`TxState`,
  reused for item availability: `AVAILABLE` by default), price, deposit,
  `geom` (**server-only**), vicinity, description, `specs` (`@ElementCollection`
  into `item_spec`), rating, reviews, image (CSS gradient string).
- **`Transaction`** (`tx`) — id, itemId, itemTitle, borrowerId, lenderId,
  mode, state, fee, deposit, days, lateFee (nullable), createdAt, dueAt,
  returnedAt, coordsUnlocked.
- **`Wallet`** (`wallet`) — userId (PK), available, locked, earned,
  pendingClear, `@Version` (optimistic locking) — one row per user.
- **`LedgerEntry`** (`ledger_entry`) — id, userId, type, label, amount
  (signed double — negative = debit/lock, positive = credit), at, status,
  txId (nullable link back to the originating transaction).
- **`Notification`** (`notification`) — id, userId, type, text, at, unread.
- **`Verification`** (`verification`) — id, kind, userId, submittedAt,
  amount (nullable, RECEIPT only), doc, status, ledgerId (links a RECEIPT
  verification to the ledger entry it will clear on approval).
- **`Message`** (`message`) — id, txId, senderId, body, at, readAt (nullable).

### 3.3 State machine (`domain.StateMachine`)

The single source of truth for legal transaction transitions:

```
AVAILABLE → REQUESTED
REQUESTED → APPROVED | DECLINED | CANCELLED
APPROVED  → ACTIVE | CANCELLED
ACTIVE    → RETURNED | OVERDUE
OVERDUE   → RETURNED
RETURNED, DECLINED, CANCELLED → (terminal)
```

`canTransition(from, to)`, `nextStates(from)`, `isTerminal(state)`, and
`LIFECYCLE` (the happy path: `AVAILABLE → REQUESTED → APPROVED → ACTIVE → RETURNED`)
are all pure lookups against this table. Every state change in the codebase
goes through `canTransition` before mutating `tx.state`; failures throw
`IllegalTransitionException` → `409 ILLEGAL_TRANSITION`.

Note: nothing currently drives `ACTIVE → OVERDUE` automatically. There's no
scheduled sweep job despite `@EnableScheduling` on the application class —
`TransactionRepository.findByStateAndDueAtBefore` exists (clearly intended
for this) but has no caller anywhere. `OVERDUE` transactions only occur via
seed data or would need to be added by a future scheduled job.

---

## 4. Security & Auth

- **Transport**: stateless JWT bearer auth. `SecurityConfig` disables CSRF,
  disables sessions, and registers `JwtAuthFilter` before the standard
  username/password filter.
- **Route rules** (`SecurityConfig`):
  - Public: `OPTIONS /**`, `POST /api/auth/login`, `POST /api/auth/signup`,
    `/api/categories`, `/actuator/health`, `/error`.
  - `ROLE_ADMIN` required: `/api/admin/**`.
  - Everything else: any authenticated user.
- **`JwtAuthFilter`**: reads the `Authorization: Bearer <token>` header,
  calls `TokenService.verify()`, and on success puts the **userId string**
  into the `SecurityContext` as principal with authority `ROLE_ADMIN` or
  `ROLE_USER` depending on the token's `admin` claim. Any verification
  failure clears the context (falls through to a raw 401).
- **`DevJwtTokenService`** (the only `TokenService` implementation today):
  HS256, signing key from `telos.jwt.secret`, 24h TTL by default. Token
  claims: subject = userId, `email`, `admin` (boolean). `verify()` uses
  `jjwt`'s standard parser, which validates the signature and expiry
  together — there's no separate expiry check needed.
- **`CurrentUser`** (injected everywhere): `.id()` returns the authenticated
  userId or throws `NotFoundException`; `.isAdmin()` checks for
  `ROLE_ADMIN`. `AdminService` calls `isAdmin()` itself as defense in depth,
  on top of the route-level `hasRole("ADMIN")` check.
- **Passwords**: BCrypt (`PasswordEncoder` bean). `DevDataInitializer` runs
  once at startup and BCrypt-hashes the demo password (`demo1234`) for any
  seeded user missing a `passwordHash`, idempotently.
- **Production seam**: swap in a Firebase-backed `TokenService`
  (`verifyIdToken`, marked `@Primary`) — filter, controllers, and frontend
  contract are unchanged.

### Coordinate & credential privacy

This is the load-bearing invariant across the whole app: **raw `geom` /
`homeGeom` / `passwordHash` are never serialized.** Every response is built
from a DTO `record`, never an entity. Items expose only a derived
`offset{x,y}` (km, relative to the viewer), `vicinity` (a neighborhood-level
label), `distanceKm`, and `coordsUnlocked`. Discovery (`GET /api/items`)
always reports `coordsUnlocked:false`; item detail flips it to `true` only
for the item's owner or a viewer with a transaction on that item in
`APPROVED, ACTIVE, OVERDUE, RETURNED` state (i.e., progressed past a mere
pending request).

---

## 5. Error handling (`common/`)

Three typed exceptions, all mapped by `@RestControllerAdvice GlobalExceptionHandler`:

| Throw | HTTP | Body |
|---|---|---|
| `NotFoundException(msg)` | 404 | `{"error":"NOT_FOUND","message":…}` |
| `IllegalTransitionException(from,to)` | 409 | `{"error":"ILLEGAL_TRANSITION","from":…,"to":…}` |
| `BusinessException(code, msg, status)` | `status` | `{"error":code,"message":…}` |
| `MethodArgumentNotValidException` / `ConstraintViolationException` (bean validation) | 400 | `{"error":"VALIDATION_ERROR","message":…}` |

Two spots bypass this shape and fall through to Spring Boot's default error
handling instead of a clean JSON body: an invalid `toState` string in
`PATCH /api/transactions/{id}` (`TxState.valueOf` throws
`IllegalArgumentException` uncaught), and an invalid `status` filter string
in `GET /api/admin/verifications` (`VerificationStatus.valueOf`, same issue).
Not fixed in this pass — flagging as a known gap (§12).

---

## 6. Slice-by-slice reference

### 6.1 `auth` — `/api/auth/*`, `/api/me`

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `POST /api/auth/login` | public | 200 | `{email,password}` → `{token, user}` |
| `POST /api/auth/signup` | public | 201 | `{name,email,password≥8,neighborhood}` |
| `POST /api/auth/logout` | user | 204 | stateless — just tells client to drop the token |
| `GET /api/me` | user | 200 | current user's `UserProfileDto` |

`login` throws `401 INVALID_CREDENTIALS` for unknown email, missing hash
(seeded neighbor with no password), or a BCrypt mismatch — one error shape
for all three, so failed logins don't reveal which case occurred. `signup`
throws `409 EMAIL_TAKEN` if the email already exists; on success it creates
both a `User` (id `u-<12 char id>`, `rating=0`, `kycStatus=PENDING`,
`admin=false`) and a matching zero-balance `Wallet`, then issues a token.

`UserProfileDto` deliberately excludes `homeGeom` and `passwordHash`.

### 6.2 `user` — `/api/users/{id}`

Single read-only endpoint, authenticated, returns any user's
`PublicProfileDto` (id, name, rating, reviews, verified, joined — no email,
no kycStatus, no coordinates). This is an intentional public-profile view,
not an owner-restricted resource, so there's no ownership check to make.

### 6.3 `item` — `/api/items*`, `/api/categories`

| Endpoint | Auth | Status |
|---|---|---|
| `GET /api/items?radiusKm=&mode=&category=&sort=` | user | 200 |
| `GET /api/items/{id}` | user | 200 / 404 |
| `POST /api/items` | user | 201 |
| `GET /api/categories` | public | 200 |

- **Discovery** uses `ItemRepository.findWithinRadius`, a native PostGIS
  query (`ST_DWithin` + `ST_Distance`) parameterized against the viewer's
  `homeGeom`, ordered by distance. Mode/category filters are null-safe
  (`ALL`/blank → no filter). `sort` is accepted but currently ignored —
  results are always distance-ascending. Always reports
  `coordsUnlocked:false`.
- **Detail** computes `distanceKm`/`offset` locally via haversine, and
  unlocks coordinates per the rule in §4.
- **Create**: `ownerId` always comes from `CurrentUser`, never client input.
  `price` is forced to `0.0` for `BORROW` mode regardless of what's
  submitted. New items inherit the owner's `homeGeom` and neighborhood.

`Categories.ALL` is a static list of 8 categories (tools, electronics,
outdoor, books, kitchen, sports, party, baby) with id/label/icon, backing
the public `/api/categories` endpoint.

### 6.4 `transaction` — `/api/transactions*`

| Endpoint | Auth | Status |
|---|---|---|
| `GET /api/transactions?role=&status=` | user | 200 |
| `POST /api/transactions` | user | 201 |
| `PATCH /api/transactions/{id}` | user | 200 |

This is the escrow core.

- **`list`**: role filter (`BORROWER`/`LENDER`/`ALL`) and status filter
  (`OPEN` = REQUESTED/APPROVED/ACTIVE/OVERDUE, `CLOSED` =
  RETURNED/DECLINED/CANCELLED, `ALL`, or an explicit state name).
- **`create`**: item must be `AVAILABLE` (else `409 ITEM_UNAVAILABLE`). Fee
  is computed by mode — `BUY` → full price, `RENT` → price × days, `BORROW`
  → 0. `hold = fee + deposit` must not exceed the borrower's wallet
  `available` (else `409 INSUFFICIENT_FUNDS` — fixed this session from a
  422 to match the documented contract). On success: new `Transaction` in
  `REQUESTED`, escrow lock moves `hold` from `available` → `locked` on the
  borrower's wallet, and a matching `ESCROW_LOCK` ledger entry (amount
  `-hold`, status `LOCKED`) is written in the same transactional method.
  Returns a `WalletEcho` snapshot alongside the transaction.
- **`transition`** (the PATCH handler): caller must be a participant (else
  404, not 403 — doesn't reveal existence to non-parties).
  `StateMachine.canTransition` gates every change. Role-restricted
  transitions: `APPROVED`/`DECLINED` require the lender, `CANCELLED`
  requires the borrower (`403 FORBIDDEN` otherwise). Approving sets
  `coordsUnlocked = true`. Declining or cancelling releases the full escrow
  hold back to the borrower's `available` with a `DEPOSIT_RELEASE` ledger
  entry.

Known gap: nothing here (or anywhere) flips `Item.state` away from
`AVAILABLE` on request, so the item-availability check on a second
concurrent request only re-reads a state that was never changed — see §12.

### 6.5 `wallet` — `/api/wallet*`

| Endpoint | Auth | Status |
|---|---|---|
| `GET /api/wallet` | user | 200 |
| `POST /api/wallet/topups` | user | 202 |

`GET` returns balances (`available, locked, earned, pendingClear`) plus the
full ledger history, newest first. `topup` requires a positive amount
(`@NotNull @Positive` — added this session, previously unvalidated): it
creates a `PENDING` `TOPUP` ledger entry, bumps `pendingClear`, and enqueues
a `RECEIPT` verification for admin review, linking the ledger entry via
`ledgerId` so approval can clear it later.

### 6.6 `handoff` — `/api/handoff/*`

| Endpoint | Auth | Status |
|---|---|---|
| `POST /api/handoff/{txId}/token` | user | 201 |
| `POST /api/handoff/scan` | user | 200 / 410 |

QR-code-style pickup/return flow. Tokens are minted and tracked in an
**in-memory** `ConcurrentHashMap` (not persisted — lost on restart, doesn't
work across multiple instances), single-use, 120-second TTL. Token format:
`TELOS:<txId>:<random8>:<expiryEpochMillis>`.

- **`mint`**: caller must be a participant (404 otherwise). Phase is
  `"pickup"` if the transaction is currently `APPROVED`, else `"return"`.
- **`scan`**: rejects unknown/used/expired tokens with `410 TOKEN_EXPIRED`.
  Validates the caller is a participant (**fixed this session** — `scan`
  previously accepted the `uid` parameter but never checked it, so any
  authenticated user holding a valid token string could advance or settle
  someone else's transaction). Determines the target state from the
  transaction's current state (`APPROVED→ACTIVE` for pickup,
  `ACTIVE/OVERDUE→RETURNED` for return), double-checked against
  `StateMachine.canTransition`.
- **`settleOnReturn`** (called when the scan reaches `RETURNED`): releases
  the deposit portion of escrow back to the borrower (`locked -= hold`,
  `available += deposit`, `DEPOSIT_RELEASE` ledger entry) and, if the fee is
  non-zero, pays it out to the lender (`earned += fee`, `available += fee`,
  `PAYOUT` ledger entry). Both wallet writes and both ledger writes happen
  inside the same `@Transactional scan()` call.

### 6.7 `admin` — `/api/admin/*` (route-gated `ROLE_ADMIN`)

| Endpoint | Status |
|---|---|
| `GET /api/admin/verifications?status=` | 200 |
| `PATCH /api/admin/verifications/{id}` | 200 |
| `GET /api/admin/metrics` | 200 |

- **`list`**: optionally filtered by `VerificationStatus`; always returns
  computed `AdminMetrics` alongside the queue.
- **`decide`**: **fixed this session** — now rejects deciding a
  verification that isn't still `PENDING` with `409 ALREADY_DECIDED`. This
  closes a double-credit bug: previously, re-approving an already-approved
  `RECEIPT` verification would run `clearReceiptFunds` again, crediting the
  wallet a second time even though the linked ledger entry was already
  `CLEARED` (the fallback `amount = v.getAmount()` re-applied the original
  amount with no new ledger entry to back it). Decision must be `APPROVED`
  or `REJECTED` (else `400 INVALID_DECISION`). Approving a `RECEIPT`
  verification calls `clearReceiptFunds`, which clears the linked `PENDING`
  ledger entry to `CLEARED` and moves its amount from `pendingClear` to
  `available`.
- **`metrics`**: `activeRentals` (ACTIVE+OVERDUE tx count), `gmv` (sum of
  all tx fees), `escrowHeld` (sum of all wallet `locked` balances),
  `pendingVerifications` (PENDING count), `newUsers7d` (joined in the last
  7 days), `disputeRate` (overdue % of all transactions, 1 decimal).
- **Defense in depth**: `AdminService` now calls `currentUser.isAdmin()`
  itself on every method (**added this session**) rather than relying
  solely on the `SecurityConfig` route rule.

### 6.8 `notification` — `/api/notifications*`

| Endpoint | Status |
|---|---|
| `GET /api/notifications` | 200 |
| `PATCH /api/notifications/read` | 200 |

Read-only feed (`unreadCount` + items, newest first) and a dedicated bulk
mark-all-read endpoint. The GET path has no mutating side effect — this was
already correct and served as the template for fixing chat (§6.9).

### 6.9 `chat` — `/api/chats*`

| Endpoint | Status |
|---|---|
| `GET /api/chats` | 200 |
| `GET /api/chats/{txId}` | 200 |
| `PATCH /api/chats/{txId}/read` | 200 (empty body) |
| `POST /api/chats/{txId}/messages` | 201 |

Conversations are keyed to a transaction; the two participants are its
borrower and lender. Chat only accepts new messages once the transaction is
`APPROVED, ACTIVE, OVERDUE,` or `RETURNED` (else `409 CHAT_LOCKED`).
Non-participants get 404, not 403, for both list-item access and direct
conversation fetch — existence isn't revealed to outsiders.

**Fixed this session**: `GET /api/chats/{txId}` used to mark the
counterparty's messages read as a side effect of fetching the conversation
— a GET-mutates violation. That's now split out into its own
`PATCH /api/chats/{txId}/read`, matching the notification endpoint's
pattern; the GET handler is now `@Transactional(readOnly = true)` and has
no side effects.

`ConversationDto` also reports `escrowLocked` (sum of the borrower's still-
`LOCKED` ledger entries for that transaction) so the chat UI can show what's
at stake.

---

## 7. Database

### 7.1 Migrations (`src/main/resources/db/migration`)

- **`V1__schema.sql`** — enables PostGIS, creates all core tables
  (`app_user`, `item`, `item_spec`, `tx`, `wallet`, `ledger_entry`,
  `notification`, `verification`) with GIST indexes on the two geography
  columns (`app_user.home_geom`, `item.geom`) and standard indexes on
  foreign-key-ish columns (owner_id, category, borrower_id, lender_id,
  item_id, user_id, status).
- **`V2__seed.sql`** — 6 users (u-001 Aliya Rahman is the admin), 12 items
  across all categories/modes, 6 transactions covering every terminal and
  non-terminal state (including one `OVERDUE` with a late fee and one
  `DECLINED`), wallets for all users, 6 ledger entries, 4 notifications, and
  5 verification-queue items (mixing KYC/RECEIPT and
  PENDING/APPROVED/REJECTED).
- **`V3__chat.sql`** — creates `message` (FK to `tx` with cascade delete),
  seeds 8 messages across two conversations.

`spring.jpa.hibernate.ddl-auto=validate` — Hibernate never generates DDL;
entity field mappings must match these migrations exactly, and any schema
change has to go through a new Flyway migration.

### 7.2 Demo credentials

All seeded users share password `demo1234` (hashed at startup by
`DevDataInitializer`, since the seed SQL can't pre-compute a BCrypt hash
without the app's configured strength). Primary demo user:
`aliya.rahman@telos.app` (`u-001`), who is also the sole admin.

---

## 8. Configuration (`application.yml`)

| Property | Default | Purpose |
|---|---|---|
| `TELOS_DB_URL` | `jdbc:postgresql://localhost:5433/telos` | JDBC URL (note: port 5433, not 5432) |
| `TELOS_DB_USER` / `TELOS_DB_PASSWORD` | `telos` / `telos` | DB credentials |
| `TELOS_PORT` | `8080` | HTTP listen port |
| `TELOS_JWT_SECRET` | dev placeholder | HS256 signing key — **must be set in production** |
| `TELOS_CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Allowed frontend origins, comma-split |

Other fixed settings: JPA `open-in-view: false` (no lazy loading outside a
transaction — this is why `ItemService.detail()` explicitly materializes
`item.specs` before the transaction ends), Flyway `baseline-on-migrate:
true`, JDBC timezone forced to UTC, `telos.jwt.ttl-seconds: 86400` (24h).

---

## 9. Build

Maven, Java 17 toolchain. Key dependencies: Spring Boot starters (Web, Data
JPA, Validation, Security), Flyway (+ PostgreSQL Flyway plugin), the
`postgresql` JDBC driver, `hibernate-spatial` for geography mapping, and
`jjwt` (api/impl/jackson) for JWT signing and parsing. No other third-party
libraries — the project deliberately keeps its dependency surface small.

Build command: `mvn -B -q compile`. This machine doesn't currently have a
Java/Maven toolchain installed, so compilation couldn't be re-verified after
the fixes in this session — run it in an environment with JDK 17 + Maven
before deploying.

---

## 10. Verification (`smoke-test.sh`)

A 21-check bash script exercising the full lifecycle against a running
server: login → signup → discovery (with a coordinate-leak assertion) →
item detail/create → transaction request → illegal-transition rejection →
wallet read/topup → QR mint/scan (including an expired-token 410 case) →
admin verification decide → non-admin 403 check → user/notification reads.
Run with `bash smoke-test.sh` (or `TELOS_BASE=http://host:port bash
smoke-test.sh` against a non-default port).

---

## 11. Cross-cutting invariants (as enforced in code)

- **Coordinate & credential privacy** — never serialize `geom`, `homeGeom`,
  `passwordHash`. (§4)
- **Escrow atomicity** — every money movement (lock, release, payout,
  topup, penalty-clear) happens inside one `@Transactional` service method
  that updates the `Wallet` and writes the matching `LedgerEntry` together.
- **Wallet arithmetic** — `available` must not go negative; checked before
  mutation with a `409 INSUFFICIENT_FUNDS` (transaction create) or
  `@Positive` request validation (topup). Ledger `amount` is signed:
  debits negative, credits positive.
- **State machine is authoritative** — every `Transaction.state` write goes
  through `StateMachine.canTransition`; failures are `409
  ILLEGAL_TRANSITION`, never a silently-accepted client-supplied state.
- **Ownership checks** — acting on a transaction/verification/chat you're
  not party to is `404 NOT_FOUND` (existence hidden), except where a
  wrong-role action by an actual party is `403 FORBIDDEN` (e.g. a borrower
  trying to approve their own request).
- **Idempotent reads** — GET endpoints never mutate state (chat's read-mark
  was the one violation; now fixed — see §12).

---

## 12. Fixes applied this session

The following were found during an invariant-compliance audit and fixed:

1. **`HandoffService.scan()`** had no check that the scanning user was a
   participant on the transaction — any authenticated user holding a valid
   token string could advance or settle someone else's transaction,
   including triggering real payouts. Now checks borrower/lender membership
   before proceeding, mirroring `mint()`.
2. **`AdminService.decide()`** could double-credit a wallet if an
   already-`APPROVED` verification was decided again (double-click, retry,
   or race) — the wallet-crediting logic ran a second time with no new
   ledger entry backing it. Now rejects non-`PENDING` verifications with
   `409 ALREADY_DECIDED` before any mutation.
3. **`AdminService`** relied solely on the `SecurityConfig` route rule for
   admin gating, with no service-layer check. Added `currentUser.isAdmin()`
   defense-in-depth to `list`, `decide`, and `metrics`.
4. **`TopupRequest.amount`** had no validation — a negative or zero amount
   could decrement `pendingClear` below zero and create a negative-signed
   `TOPUP` ledger entry. Added `@NotNull @Positive` plus `@Valid` on the
   controller.
5. **`TransactionService.create()`**'s insufficient-funds check threw `422
   UNPROCESSABLE_ENTITY` instead of the documented `409 CONFLICT`. Fixed to
   match the contract.
6. **`ChatService.conversation()`** mutated state (marked messages read) as
   a side effect of a GET request, violating the idempotent-reads
   invariant. Split into a read-only `conversation()` and a new
   `PATCH /api/chats/{txId}/read` for the mutation, matching the existing
   notification pattern.
7. **`CreateTransactionRequest.days`** was a nullable `Integer` being
   unboxed into a primitive `int` at the service boundary — a missing or
   `null` `days` field in the request body would throw an unhandled `NPE`
   (surfacing as a raw 500). Fixed to default to `1` before unboxing.

## 13. Known gaps not yet fixed

- **No scheduled overdue sweep.** `@EnableScheduling` is declared on the
  application class but no `@Scheduled` method exists anywhere, and
  `TransactionRepository.findByStateAndDueAtBefore` (clearly written for
  this purpose) has zero callers. `ACTIVE → OVERDUE` currently only happens
  via seed data — there's no automatic transition when a rental's `dueAt`
  passes.
- **Handoff tokens are in-memory only.** `HandoffService`'s token store is
  a `ConcurrentHashMap`, not persisted — tokens don't survive an app
  restart and won't work correctly in a multi-instance deployment.
- **Item availability isn't locked on request.** `TransactionService.create`
  checks `Item.state == AVAILABLE` but never changes it, so nothing at the
  data layer stops the same item being requested again concurrently before
  the first request is approved/declined.
- **Two `enum.valueOf` call sites bypass `GlobalExceptionHandler`.** An
  invalid `toState` string on `PATCH /api/transactions/{id}`, or an invalid
  `status` filter on `GET /api/admin/verifications`, throws an
  `IllegalArgumentException` that isn't mapped to the app's usual JSON
  error shape.
- **`mint()` doesn't reject terminal-state transactions.** Minting a
  handoff token for a `RETURNED`/`DECLINED`/`CANCELLED` transaction
  succeeds (mislabeling the phase as `"return"`), though `scan()`
  independently re-validates via `StateMachine.canTransition` so this isn't
  exploitable — just a UX/labeling gap.
