-- Reconcile legacy demo rows atomically before adding cross-table integrity rules.
-- If an existing database has drifted from the known seed snapshot, abort with
-- an actionable error instead of silently creating ledger rows without funds.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM tx WHERE id = 'tx-1003') THEN
        IF NOT EXISTS (
                SELECT 1 FROM tx
                WHERE id = 'tx-1003' AND state = 'REQUESTED'
                  AND borrower_id = 'u-103' AND lender_id = 'u-001'
                  AND fee = 27.0 AND deposit = 60.0)
           OR NOT EXISTS (
                SELECT 1 FROM tx
                WHERE id = 'tx-1005' AND state = 'OVERDUE'
                  AND borrower_id = 'u-105' AND lender_id = 'u-001'
                  AND fee = 54.0 AND deposit = 250.0 AND late_fee = 32.0)
           OR NOT EXISTS (
                SELECT 1 FROM wallet
                WHERE user_id = 'u-001' AND available = 412.5 AND locked = 250.0)
           OR NOT EXISTS (
                SELECT 1 FROM wallet
                WHERE user_id = 'u-103' AND available = 150.0 AND locked = 0.0)
           OR NOT EXISTS (
                SELECT 1 FROM wallet
                WHERE user_id = 'u-105' AND available = 150.0
                  AND locked = 0.0 AND pending_clear = 0.0)
           OR EXISTS (
                SELECT 1 FROM ledger_entry
                WHERE tx_id IN ('tx-1003', 'tx-1005') AND type = 'ESCROW_LOCK')
           OR NOT EXISTS (
                SELECT 1 FROM ledger_entry
                WHERE id = 'l-5' AND user_id = 'u-001' AND type = 'PENALTY'
                  AND amount = 32.0 AND status = 'CLEARED' AND tx_id = 'tx-1005')
           OR NOT EXISTS (
                SELECT 1 FROM verification
                WHERE id = 'vq-3' AND kind = 'RECEIPT' AND user_id = 'u-105'
                  AND amount = 250.0 AND status = 'PENDING' AND ledger_id IS NULL) THEN
            RAISE EXCEPTION USING
                MESSAGE = 'V5 cannot safely reconcile drifted demo financial rows',
                HINT = 'Reconcile tx-1003, tx-1005, vq-3, their wallets and ledgers, then rerun Flyway.';
        END IF;

        UPDATE tx SET lender_id = 'u-101' WHERE id IN ('tx-1003', 'tx-1005');
        UPDATE item SET state = 'REQUESTED' WHERE id = 'it-01';
        UPDATE item SET state = 'ACTIVE' WHERE id = 'it-02';
        UPDATE item SET state = 'APPROVED' WHERE id = 'it-04';
        UPDATE item SET state = 'OVERDUE' WHERE id = 'it-06';
        UPDATE ledger_entry
        SET user_id = 'u-101', status = 'PENDING'
        WHERE id = 'l-5';
        UPDATE notification SET user_id = 'u-101' WHERE id IN ('n-1', 'n-3');

        UPDATE wallet SET available = 340.5, locked = 322.0 WHERE user_id = 'u-001';
        UPDATE wallet SET available = 63.0, locked = 87.0 WHERE user_id = 'u-103';
        UPDATE wallet
        SET available = 150.0, locked = 304.0, pending_clear = 250.0
        WHERE user_id = 'u-105';

        INSERT INTO ledger_entry
            (id, user_id, type, label, amount, at, status, tx_id)
        VALUES
            ('l-seed-tx1003-lock', 'u-103', 'ESCROW_LOCK',
             'Escrow locked · Bosch 18V Cordless Drill Kit', -87.0,
             '2026-06-26T09:15:00Z', 'LOCKED', 'tx-1003'),
            ('l-seed-tx1005-lock', 'u-105', 'ESCROW_LOCK',
             'Escrow locked · PlayStation 5 + 2 Controllers', -304.0,
             '2026-06-18T12:00:00Z', 'LOCKED', 'tx-1005'),
            ('l-seed-vq3-topup', 'u-105', 'TOPUP',
             'Wallet top-up · high-value receipt', 250.0,
             '2026-06-25T16:40:00Z', 'PENDING', NULL);

        UPDATE verification
        SET ledger_id = 'l-seed-vq3-topup'
        WHERE id = 'vq-3';
    END IF;

    IF EXISTS (
        SELECT t.id
        FROM tx t
        LEFT JOIN ledger_entry entry
          ON entry.tx_id = t.id
         AND entry.type = 'ESCROW_LOCK'
         AND entry.status = 'LOCKED'
        WHERE t.state IN ('REQUESTED', 'APPROVED', 'ACTIVE', 'OVERDUE')
        GROUP BY t.id, t.borrower_id, t.fee, t.deposit
        HAVING COUNT(entry.id) <> 1
            OR ABS(COALESCE(SUM(entry.amount), 0) + t.fee + t.deposit) > 0.000001
            OR COUNT(entry.id) FILTER (WHERE entry.user_id <> t.borrower_id) > 0
    ) THEN
        RAISE EXCEPTION 'Open transaction escrow ledger postcondition failed';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tx t
        JOIN item i ON i.id = t.item_id
        WHERE t.state IN ('REQUESTED', 'APPROVED', 'ACTIVE', 'OVERDUE')
          AND i.state <> t.state
    ) THEN
        RAISE EXCEPTION 'Listing state does not match open transaction state';
    END IF;

    IF EXISTS (
        WITH expected AS (
            SELECT borrower_id AS user_id, SUM(fee + deposit) AS amount
            FROM tx
            WHERE state IN ('REQUESTED', 'APPROVED', 'ACTIVE', 'OVERDUE')
            GROUP BY borrower_id
        )
        SELECT 1
        FROM wallet w
        LEFT JOIN expected e ON e.user_id = w.user_id
        WHERE ABS(w.locked - COALESCE(e.amount, 0)) > 0.000001
    ) THEN
        RAISE EXCEPTION 'Wallet locked balance does not equal aggregate open escrow';
    END IF;

    IF EXISTS (
        WITH expected AS (
            SELECT user_id, SUM(amount) AS amount
            FROM ledger_entry
            WHERE type = 'TOPUP' AND status = 'PENDING'
            GROUP BY user_id
        )
        SELECT 1
        FROM wallet w
        LEFT JOIN expected e ON e.user_id = w.user_id
        WHERE ABS(w.pending_clear - COALESCE(e.amount, 0)) > 0.000001
    ) THEN
        RAISE EXCEPTION 'Wallet pending_clear does not equal aggregate pending top-ups';
    END IF;
END $$;

-- Data-layer invariants for parties, ownership, and linked financial records.
ALTER TABLE tx
    ADD CONSTRAINT chk_tx_distinct_parties
        CHECK (borrower_id <> lender_id);

ALTER TABLE item
    ADD CONSTRAINT uq_item_id_owner UNIQUE (id, owner_id);

ALTER TABLE tx
    ADD CONSTRAINT fk_tx_item_lender
        FOREIGN KEY (item_id, lender_id) REFERENCES item (id, owner_id);

ALTER TABLE ledger_entry
    ADD CONSTRAINT fk_ledger_transaction
        FOREIGN KEY (tx_id) REFERENCES tx (id);

ALTER TABLE verification
    ADD CONSTRAINT fk_verification_ledger
        FOREIGN KEY (ledger_id) REFERENCES ledger_entry (id),
    ADD CONSTRAINT chk_receipt_has_ledger
        CHECK (kind <> 'RECEIPT'
            OR status = 'REJECTED'
            OR ledger_id IS NOT NULL);

-- Handoff bearer tokens are stored only as SHA-256 hashes. Consumption is
-- committed atomically with the transaction state and escrow settlement.
CREATE TABLE handoff_token (
    token_hash      VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(24) NOT NULL REFERENCES tx(id) ON DELETE CASCADE,
    minted_by       VARCHAR(16) NOT NULL REFERENCES app_user(id),
    from_state      VARCHAR(16) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    consumed_at     TIMESTAMPTZ,
    CONSTRAINT chk_handoff_source_state
        CHECK (from_state IN ('APPROVED', 'ACTIVE', 'OVERDUE'))
);

CREATE INDEX idx_handoff_token_expiry ON handoff_token (expires_at);
CREATE INDEX idx_handoff_token_transaction ON handoff_token (transaction_id);
