-- Integrity backstops for transaction exclusivity and escrow accounting.
-- Application-level row locks provide friendly errors; these constraints protect
-- against future code paths, multiple instances, and manual writes.

ALTER TABLE tx
    ADD CONSTRAINT fk_tx_item
        FOREIGN KEY (item_id) REFERENCES item(id),
    ADD CONSTRAINT chk_tx_amounts_nonnegative
        CHECK (fee >= 0 AND deposit >= 0),
    ADD CONSTRAINT chk_tx_days_positive
        CHECK (days >= 1);

ALTER TABLE item
    ADD CONSTRAINT chk_item_amounts_nonnegative
        CHECK (price >= 0 AND deposit >= 0);

ALTER TABLE wallet
    ADD CONSTRAINT chk_wallet_balances_nonnegative
        CHECK (available >= 0 AND locked >= 0 AND earned >= 0 AND pending_clear >= 0);

ALTER TABLE verification
    ADD CONSTRAINT chk_receipt_amount_positive
        CHECK (kind <> 'RECEIPT' OR (amount IS NOT NULL AND amount > 0));

-- A listing may have historical closed transactions but only one live lifecycle.
CREATE UNIQUE INDEX uq_tx_one_open_per_item
    ON tx (item_id)
    WHERE state IN ('REQUESTED', 'APPROVED', 'ACTIVE', 'OVERDUE');

-- Every top-up ledger entry may be reviewed only once.
CREATE UNIQUE INDEX uq_verification_ledger
    ON verification (ledger_id)
    WHERE ledger_id IS NOT NULL;

-- Settlement entries are idempotent per transaction. Penalties are excluded
-- because a transaction may legitimately accrue more than one penalty entry.
CREATE UNIQUE INDEX uq_ledger_escrow_lock_per_tx
    ON ledger_entry (tx_id)
    WHERE tx_id IS NOT NULL AND type = 'ESCROW_LOCK';

CREATE UNIQUE INDEX uq_ledger_deposit_release_per_tx
    ON ledger_entry (tx_id)
    WHERE tx_id IS NOT NULL AND type = 'DEPOSIT_RELEASE';

CREATE UNIQUE INDEX uq_ledger_payout_per_tx
    ON ledger_entry (tx_id)
    WHERE tx_id IS NOT NULL AND type = 'PAYOUT';
