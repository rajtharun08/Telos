-- Security and bounded-domain hardening.

-- Revoke known demo credentials/admin grants in every upgraded database. The
-- explicit dev-only initializer restores them after Flyway only in profile=dev;
-- AuthService independently blocks these IDs outside dev.
UPDATE app_user
SET password_hash = NULL,
    admin = FALSE
WHERE id IN ('u-001', 'u-101', 'u-102', 'u-103', 'u-104', 'u-105');

-- Upper bounds reject PostgreSQL float8 Infinity and NaN in addition to
-- excessive business values. Service validation also enforces two decimals.
ALTER TABLE item
    ADD CONSTRAINT chk_item_amounts_bounded
        CHECK (price BETWEEN 0 AND 1000000.00
           AND deposit BETWEEN 0 AND 1000000.00),
    ADD CONSTRAINT chk_item_mode_domain
        CHECK (mode IN ('BUY', 'RENT', 'BORROW')),
    ADD CONSTRAINT chk_item_state_domain
        CHECK (state IN ('AVAILABLE', 'REQUESTED', 'APPROVED', 'ACTIVE',
                         'RETURNED', 'DECLINED', 'CANCELLED', 'OVERDUE'));

ALTER TABLE tx
    ADD CONSTRAINT chk_tx_amounts_bounded
        CHECK (fee BETWEEN 0 AND 1000000.00
           AND deposit BETWEEN 0 AND 1000000.00
           AND (late_fee IS NULL OR late_fee BETWEEN 0 AND deposit)),
    ADD CONSTRAINT chk_tx_mode_domain
        CHECK (mode IN ('BUY', 'RENT', 'BORROW')),
    ADD CONSTRAINT chk_tx_state_domain
        CHECK (state IN ('REQUESTED', 'APPROVED', 'ACTIVE', 'RETURNED',
                         'DECLINED', 'CANCELLED', 'OVERDUE'));

ALTER TABLE wallet
    ADD CONSTRAINT chk_wallet_balances_bounded
        CHECK (available BETWEEN 0 AND 1000000000000.00
           AND locked BETWEEN 0 AND 1000000000000.00
           AND earned BETWEEN 0 AND 1000000000000.00
           AND pending_clear BETWEEN 0 AND 1000000000000.00);

ALTER TABLE ledger_entry
    ADD CONSTRAINT chk_ledger_amount_bounded
        CHECK (amount BETWEEN -1000000.00 AND 1000000.00),
    ADD CONSTRAINT chk_ledger_type_domain
        CHECK (type IN ('ESCROW_LOCK', 'DEPOSIT_RELEASE', 'PAYOUT', 'TOPUP', 'PENALTY')),
    ADD CONSTRAINT chk_ledger_status_domain
        CHECK (status IN ('LOCKED', 'CLEARED', 'PENDING', 'REJECTED'));

ALTER TABLE verification
    ADD CONSTRAINT chk_verification_amount_bounded
        CHECK (amount IS NULL OR amount BETWEEN 0 AND 1000000.00),
    ADD CONSTRAINT chk_verification_kind_domain
        CHECK (kind IN ('KYC', 'RECEIPT')),
    ADD CONSTRAINT chk_verification_status_domain
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Transaction locking serializes replacement; the partial index is the final
-- cross-instance backstop for one live token per issuer and transaction.
CREATE UNIQUE INDEX uq_handoff_live_issuer
    ON handoff_token (transaction_id, minted_by)
    WHERE consumed_at IS NULL;

CREATE UNIQUE INDEX uq_ledger_penalty_per_tx
    ON ledger_entry (tx_id)
    WHERE tx_id IS NOT NULL AND type = 'PENALTY';

-- Shared fixed-window buckets used by every application instance.
CREATE TABLE rate_limit_bucket (
    bucket_key        VARCHAR(64) PRIMARY KEY,
    window_started_at TIMESTAMPTZ NOT NULL,
    request_count     INTEGER NOT NULL,
    expires_at        TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_rate_limit_count CHECK (request_count > 0),
    CONSTRAINT chk_rate_limit_window CHECK (expires_at > window_started_at)
);
CREATE INDEX idx_rate_limit_expiry ON rate_limit_bucket (expires_at);

-- Foreign-key and ordered-query support missing from the original schema.
CREATE INDEX idx_ledger_tx ON ledger_entry (tx_id);
CREATE INDEX idx_ledger_user_at ON ledger_entry (user_id, at DESC);
CREATE INDEX idx_verification_user ON verification (user_id);
CREATE INDEX idx_verification_status_submitted
    ON verification (status, submitted_at DESC);
CREATE INDEX idx_tx_state_due ON tx (state, due_at);
CREATE INDEX idx_handoff_token_minted_by ON handoff_token (minted_by);
CREATE INDEX idx_message_sender ON message (sender_id);
