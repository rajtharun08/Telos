-- Telos schema. Mirrors the JPA entities under app.telos.domain.entity.
-- PostGIS is required for the item.geom geography(Point,4326) column and
-- the ST_DWithin radial discovery query.

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE app_user (
    id            VARCHAR(16)  PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    neighborhood  VARCHAR(255),
    joined        DATE,
    rating        DOUBLE PRECISION NOT NULL DEFAULT 0,
    reviews       INTEGER          NOT NULL DEFAULT 0,
    verified      BOOLEAN          NOT NULL DEFAULT FALSE,
    kyc_status    VARCHAR(16)      NOT NULL DEFAULT 'PENDING',
    admin         BOOLEAN          NOT NULL DEFAULT FALSE,
    home_geom     geography(Point,4326)
);
CREATE INDEX idx_app_user_home_geom ON app_user USING GIST (home_geom);

-- ---------------------------------------------------------------------------
-- Items (listings) + spec element collection
-- ---------------------------------------------------------------------------
CREATE TABLE item (
    id          VARCHAR(16)  PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    category    VARCHAR(32)  NOT NULL,
    owner_id    VARCHAR(16)  NOT NULL REFERENCES app_user(id),
    mode        VARCHAR(8)   NOT NULL,
    state       VARCHAR(16)  NOT NULL DEFAULT 'AVAILABLE',
    price       DOUBLE PRECISION NOT NULL DEFAULT 0,
    deposit     DOUBLE PRECISION NOT NULL DEFAULT 0,
    geom        geography(Point,4326),
    vicinity    VARCHAR(255),
    description TEXT,
    rating      DOUBLE PRECISION NOT NULL DEFAULT 0,
    reviews     INTEGER          NOT NULL DEFAULT 0,
    image       VARCHAR(255)
);

CREATE INDEX idx_item_geom     ON item USING GIST (geom);
CREATE INDEX idx_item_owner    ON item (owner_id);
CREATE INDEX idx_item_category ON item (category);

CREATE TABLE item_spec (
    item_id VARCHAR(16) NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    spec    VARCHAR(255)
);
CREATE INDEX idx_item_spec_item ON item_spec (item_id);

-- ---------------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------------
CREATE TABLE tx (
    id              VARCHAR(24) PRIMARY KEY,
    item_id         VARCHAR(16) NOT NULL,
    item_title      VARCHAR(255) NOT NULL,
    borrower_id     VARCHAR(16) NOT NULL REFERENCES app_user(id),
    lender_id       VARCHAR(16) NOT NULL REFERENCES app_user(id),
    mode            VARCHAR(8)  NOT NULL,
    state           VARCHAR(16) NOT NULL,
    fee             DOUBLE PRECISION NOT NULL DEFAULT 0,
    deposit         DOUBLE PRECISION NOT NULL DEFAULT 0,
    days            INTEGER          NOT NULL DEFAULT 1,
    late_fee        DOUBLE PRECISION,
    created_at      TIMESTAMPTZ NOT NULL,
    due_at          TIMESTAMPTZ,
    returned_at     TIMESTAMPTZ,
    coords_unlocked BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_tx_borrower ON tx (borrower_id);
CREATE INDEX idx_tx_lender   ON tx (lender_id);
CREATE INDEX idx_tx_item     ON tx (item_id);

-- ---------------------------------------------------------------------------
-- Wallet + ledger
-- ---------------------------------------------------------------------------
CREATE TABLE wallet (
    user_id       VARCHAR(16) PRIMARY KEY REFERENCES app_user(id),
    available     DOUBLE PRECISION NOT NULL DEFAULT 0,
    locked        DOUBLE PRECISION NOT NULL DEFAULT 0,
    earned        DOUBLE PRECISION NOT NULL DEFAULT 0,
    pending_clear DOUBLE PRECISION NOT NULL DEFAULT 0,
    version       BIGINT           NOT NULL DEFAULT 0
);

CREATE TABLE ledger_entry (
    id      VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(16) NOT NULL REFERENCES app_user(id),
    type    VARCHAR(24) NOT NULL,
    label   VARCHAR(255) NOT NULL,
    amount  DOUBLE PRECISION NOT NULL,
    at      TIMESTAMPTZ NOT NULL,
    status  VARCHAR(16) NOT NULL,
    tx_id   VARCHAR(24)
);
CREATE INDEX idx_ledger_user ON ledger_entry (user_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE notification (
    id      VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(16) NOT NULL REFERENCES app_user(id),
    type    VARCHAR(16) NOT NULL,
    text    TEXT        NOT NULL,
    at      TIMESTAMPTZ NOT NULL,
    unread  BOOLEAN     NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_notification_user ON notification (user_id);

-- ---------------------------------------------------------------------------
-- Admin verification queue
-- ---------------------------------------------------------------------------
CREATE TABLE verification (
    id           VARCHAR(24) PRIMARY KEY,
    kind         VARCHAR(16) NOT NULL,
    user_id      VARCHAR(16) NOT NULL REFERENCES app_user(id),
    submitted_at TIMESTAMPTZ NOT NULL,
    amount       DOUBLE PRECISION,
    doc          VARCHAR(255) NOT NULL,
    status       VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    ledger_id    VARCHAR(24)
);
CREATE INDEX idx_verification_status ON verification (status);
