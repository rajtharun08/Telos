# Telos Backend — Foundation Brief (for subagents)

You are implementing ONE vertical slice of the Telos Spring Boot backend. The
shared foundation is ALREADY WRITTEN and must not be modified. You only ADD new
files inside your assigned package(s). This brief tells you exactly what exists
and what conventions to follow so your slice compiles and integrates cleanly.

## Project

- Root: `/home/irfae/telos-backend`
- Java 17, Spring Boot 3.3.5, Maven. Package root: `app.telos`
- Build (run from project root):
  `~/.local/bin/micromamba run -n telos mvn -B -q compile`
- DB is live: PostgreSQL 16 + PostGIS 3.5 on `127.0.0.1:5433`, db `telos`,
  user/pass `telos`/`telos`. Flyway migrations V1 (schema) + V2 (seed) already
  exist and run on startup. `spring.jpa.hibernate.ddl-auto=validate` — so do NOT
  add entity fields without a matching column (you generally won't add entities).

## HARD RULES (scope isolation)

1. DO NOT edit any file under `domain/`, `repo/`, `config/`, `security/`,
   `common/`, or the `resources/db/migration/` SQL. These are shared. If you
   think one needs changing, STOP and report it in your summary instead.
2. ONLY create new files under your assigned package(s), e.g. `app.telos.<slice>`.
3. Put DTOs as Java `record`s in `app.telos.<slice>.dto`.
4. Controllers go in `app.telos.<slice>` (or `.web`), services in `.service`.
5. Match the API contract EXACTLY — field names, JSON shapes, HTTP statuses.
6. Do NOT add new Maven dependencies.

## Foundation you build ON (already exists, do not modify)

### Enums — `app.telos.domain.enums`
- `TxState`: AVAILABLE, REQUESTED, APPROVED, ACTIVE, RETURNED, DECLINED, CANCELLED, OVERDUE
- `Mode`: RENT, BORROW, BUY
- `KycStatus`: PENDING, VERIFIED, REJECTED
- `LedgerType`: ESCROW_LOCK, DEPOSIT_RELEASE, PAYOUT, TOPUP, PENALTY
- `LedgerStatus`: LOCKED, CLEARED, PENDING
- `Role`: BORROWER, LENDER  (per-viewer transaction role)
- `VerificationKind`: KYC, RECEIPT
- `VerificationStatus`: PENDING, APPROVED, REJECTED
- `NotificationType`: REQUEST, APPROVED, OVERDUE, RETURNED

### Entities — `app.telos.domain.entity` (getters/setters, no Lombok)
- `User`(id, name, email, passwordHash, neighborhood, joined:LocalDate,
  rating, reviews, verified, kycStatus, admin:boolean, homeGeom:Point)
- `Item`(id, title, category, ownerId, mode, state, price, deposit,
  geom:Point, vicinity, description, specs:List<String>, rating, reviews, image)
- `Transaction`(id, itemId, itemTitle, borrowerId, lenderId, mode, state, fee,
  deposit, days, lateFee:Double, createdAt:Instant, dueAt:Instant,
  returnedAt:Instant, coordsUnlocked:boolean)  — table `tx`
- `Wallet`(userId, available, locked, earned, pendingClear, version)  — one per user
- `LedgerEntry`(id, userId, type, label, amount:double signed, at:Instant, status, txId)
- `Notification`(id, userId, type, text, at:Instant, unread:boolean)
- `Verification`(id, kind, userId, submittedAt:Instant, amount:Double, doc,
  status, ledgerId)

### Repositories — `app.telos.repo`
- `UserRepository`: findByEmail, existsByEmail
- `ItemRepository`: findWithinRadius(Point viewer, double radiusMeters, String mode, String category) -> List<Object[]> rows of [id:String, distanceKm:Double]; findByOwnerId
- `TransactionRepository`: findByBorrowerIdOrLenderId; findByStateAndDueAtBefore; existsByItemIdAndBorrowerIdAndStateIn
- `WalletRepository`: standard JpaRepository<Wallet,String>
- `LedgerEntryRepository`: findByUserIdOrderByAtDesc
- `NotificationRepository`: findByUserIdOrderByAtDesc; countByUserIdAndUnreadTrue; markAllRead(userId)
- `VerificationRepository`: findByStatusOrderBySubmittedAtDesc; findAllByOrderBySubmittedAtDesc; countByStatus

### Security — `app.telos.security` / `app.telos.config`
- Auth is JWT Bearer. `JwtAuthFilter` validates the token and puts the **userId
  string** as the SecurityContext principal, authority `ROLE_ADMIN` or `ROLE_USER`.
- `CurrentUser` (@Component, inject it): `currentUser.id()` -> authenticated
  userId; `currentUser.isAdmin()` -> boolean.
- `TokenService` (inject it): `issue(userId, email, admin)` -> JWT string;
  `verify(token)` -> `TokenService.Principal(userId, email, admin)`.
- `PasswordEncoder` bean (BCrypt) is available to inject.
- Public routes (no auth): `/api/auth/login`, `/api/auth/signup`, `/api/categories`.
  `/api/admin/**` requires ROLE_ADMIN. Everything else requires auth.
  (Route rules already configured in SecurityConfig — you do NOT touch them, just
  know which of your endpoints are already permitted/guarded.)

### State machine — `app.telos.domain.StateMachine`
- `StateMachine.canTransition(from, to)` -> boolean
- `StateMachine.nextStates(from)` -> List<TxState>
- `StateMachine.isTerminal(state)` -> boolean
- `StateMachine.LIFECYCLE` -> happy path list

### Errors — `app.telos.common` (mapped to JSON by GlobalExceptionHandler)
- `NotFoundException(msg)` -> 404 `{error:"NOT_FOUND", message}`
- `IllegalTransitionException(from, to)` -> 409 `{error:"ILLEGAL_TRANSITION", from, to}`
- `BusinessException(httpStatus, code, msg)` -> custom status `{error:code, message}`
  Use `new BusinessException(HttpStatus.GONE, "TOKEN_EXPIRED", "...")` style.

## Conventions

- Times are ISO-8601 UTC `Instant`. Serialize as-is (Jackson handles it).
- Money is `double` dollars.
- Use constructor injection.
- `@Transactional` on service methods that mutate.
- Return DTO records from controllers, never entities (avoids leaking geom etc.).
- Coordinate privacy: NEVER serialize `item.geom` or `user.homeGeom`. Items
  expose only `offset{x,y}` (km), `vicinity`, `distanceKm`, `coordsUnlocked`.

## How to verify your slice

After writing, run from project root:
`~/.local/bin/micromamba run -n telos mvn -B -q compile`
It must compile clean. Report any error you cannot resolve within your scope.
