# Telos Backend — Spring Boot + PostgreSQL/PostGIS

The live REST backend for the [Telos](../telos-frontend) hyperlocal P2P sharing
economy. Implements every contract in
[`telos-frontend/docs/API_CONTRACTS.md`](../telos-frontend/docs/API_CONTRACTS.md)
against a real PostGIS database, replacing the frontend's in-memory mock layer.

- **Java 17**, **Spring Boot 3.3.5** (Web, Data JPA, Security, Validation)
- **PostgreSQL 16 + PostGIS 3.5** — real `ST_DWithin` radial discovery
- **Flyway** schema + seed migrations (seed mirrors the frontend's `mockData.js`)
- **hibernate-spatial** for `geography(Point,4326)` mapping
- **JWT bearer auth** (dev HS256 issuer; Firebase-verifier swap-in seam)

---

## Architecture

```
app.telos
├── domain
│   ├── entity/      User, Item, Transaction, Wallet, LedgerEntry,
│   │                Notification, Verification
│   ├── enums/       TxState, Mode, KycStatus, LedgerType, LedgerStatus,
│   │                Role, VerificationKind, VerificationStatus, NotificationType
│   └── StateMachine server-authoritative transition guard (mirrors the
│                    frontend src/lib/stateMachine.js exactly)
├── repo/            Spring Data JPA repositories (+ native PostGIS query)
├── security/        TokenService (DevJwtTokenService), CurrentUser
├── config/          SecurityConfig (stateless JWT + CORS), JwtAuthFilter,
│                    DevDataInitializer (BCrypts demo passwords on seeded users)
├── common/          Exception types + GlobalExceptionHandler
├── auth/            POST /api/auth/login|signup|logout, GET /api/me
├── user/            GET /api/users/{id}
├── item/            GET/POST /api/items, GET /api/items/{id}, /api/categories
├── transaction/     GET/POST /api/transactions, PATCH /api/transactions/{id}
├── wallet/          GET /api/wallet, POST /api/wallet/topups
├── handoff/         POST /api/handoff/{txId}/token, POST /api/handoff/scan
├── admin/           GET /api/admin/verifications, PATCH …/{id}
└── notification/    GET /api/notifications, PATCH /api/notifications/read
```

### Design notes

- **Coordinate privacy is enforced server-side.** Item responses never include
  raw coordinates — only the viewer-relative `offset{x,y}` (km), `vicinity`,
  `distanceKm`, and `coordsUnlocked`. Discovery always reports
  `coordsUnlocked:false`; item detail flips it `true` only when the viewer owns
  the item or has a non-pending transaction for it.
- **Escrow is transactional.** Requesting an item atomically moves `fee+deposit`
  from the borrower's `available` to `locked` and writes an `ESCROW_LOCK` ledger
  entry. Decline/cancel releases it back; a return handoff settles the deposit to
  the borrower and pays the fee out to the lender.
- **The state machine is authoritative.** Illegal transitions are rejected with
  `409 ILLEGAL_TRANSITION`; the frontend's `canTransition` only mirrors it.

---

## Prerequisites

A JDK 17, Maven, and PostgreSQL 16 + PostGIS. This repo was built with a
**userland (no-root) toolchain** via [micromamba](https://mamba.readthedocs.io):

```bash
# one-time: create an isolated env with the whole toolchain
micromamba create -y -n telos -c conda-forge \
  "openjdk=17" "maven>=3.9" "postgresql=16" "postgis"
```

All commands below assume that env — prefix with `micromamba run -n telos` if
you used it.

---

## 1. Start PostgreSQL + PostGIS

```bash
PGDATA="$HOME/.local/share/telos-pg"
# init once
micromamba run -n telos initdb -D "$PGDATA" -U postgres --auth=trust
# start on port 5433
micromamba run -n telos pg_ctl -D "$PGDATA" -o "-p 5433" -l "$PGDATA/server.log" -w start

# create the role, database, and PostGIS extension
micromamba run -n telos psql -h localhost -p 5433 -U postgres -c \
  "CREATE ROLE telos LOGIN PASSWORD 'telos';"
micromamba run -n telos createdb -h localhost -p 5433 -U postgres -O telos telos
micromamba run -n telos psql -h localhost -p 5433 -U postgres -d telos -c \
  "CREATE EXTENSION IF NOT EXISTS postgis;"
```

## 2. Run the backend

```bash
micromamba run -n telos mvn spring-boot:run
# → http://localhost:8080  (Flyway runs V1 schema + V2 seed on first boot)
```

Configuration is environment-overridable (see `src/main/resources/application.yml`).
Defaults target the local cluster above:

| Env var | Default | Purpose |
| --- | --- | --- |
| `TELOS_DB_URL` | local Postgres on port 5433, database `telos` | JDBC connection string |
| `TELOS_DB_USER` | `telos` | Database user |
| `TELOS_DB_PASSWORD` | `telos` | Database password |
| `TELOS_PORT` | `8080` | HTTP port the backend listens on |
| `TELOS_JWT_SECRET` | dev default | HS256 signing key — **set in production** |
| `TELOS_CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Allowed frontend origins |

The full default JDBC URL is in `application.yml` (`spring.datasource.url`).

## 3. Verify

```bash
bash smoke-test.sh            # 21 checks across the full lifecycle
# or against a custom port:
TELOS_BASE=http://localhost:8090 bash smoke-test.sh
```

The smoke test exercises login → discover → request → approve → handoff →
return → admin, and asserts coordinate privacy plus the 409/410/403 guard paths.

---

## Demo credentials

Seeded users all use password `demo1234` (BCrypt-hashed at startup by
`DevDataInitializer`). The primary demo user is `aliya.rahman@telos.app`
(`u-001`), who is also the admin for the verification queue.

---

## Auth: dev JWT today, Firebase tomorrow

`DevJwtTokenService` issues/verifies HS256 tokens carrying `userId`, `email`, and
an `admin` flag — fully runnable with no external dependency. To go to production
with Firebase, implement `TokenService` with the Firebase Admin SDK
(`verifyIdToken`), mark it `@Primary`, and set the service-account env. The
security filter, controllers, and frontend contract are unchanged.
