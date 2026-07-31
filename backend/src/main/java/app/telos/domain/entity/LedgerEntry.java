package app.telos.domain.entity;

import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import jakarta.persistence.*;

import java.time.Instant;

/** A single immutable wallet ledger entry. */
@Entity
@Table(name = "ledger_entry")
public class LedgerEntry {

    @Id
    @Column(length = 24)
    private String id; // e.g. "l-1"

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private LedgerType type;

    @Column(nullable = false)
    private String label;

    /** Signed dollar amount; negative for locks/penalties. */
    @Column(nullable = false)
    private double amount;

    @Column(name = "at", nullable = false)
    private Instant at;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LedgerStatus status;

    /** Optional link back to the transaction that produced this entry. */
    @Column(name = "tx_id", length = 24)
    private String txId;

    public LedgerEntry() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public LedgerType getType() { return type; }
    public void setType(LedgerType type) { this.type = type; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public Instant getAt() { return at; }
    public void setAt(Instant at) { this.at = at; }
    public LedgerStatus getStatus() { return status; }
    public void setStatus(LedgerStatus status) { this.status = status; }
    public String getTxId() { return txId; }
    public void setTxId(String txId) { this.txId = txId; }
}
