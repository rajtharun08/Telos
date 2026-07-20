package app.telos.domain.entity;

import app.telos.domain.enums.TxState;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Database-backed metadata for a short-lived handoff bearer token. */
@Entity
@Table(name = "handoff_token")
public class HandoffToken {

    /** SHA-256 of the bearer token; the plaintext token is never persisted. */
    @Id
    @Column(name = "token_hash", length = 64)
    private String tokenHash;

    @Column(name = "transaction_id", nullable = false, length = 24)
    private String transactionId;

    @Column(name = "minted_by", nullable = false, length = 16)
    private String mintedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_state", nullable = false, length = 16)
    private TxState fromState;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    public HandoffToken() {}

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getMintedBy() { return mintedBy; }
    public void setMintedBy(String mintedBy) { this.mintedBy = mintedBy; }
    public TxState getFromState() { return fromState; }
    public void setFromState(TxState fromState) { this.fromState = fromState; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getConsumedAt() { return consumedAt; }
    public void setConsumedAt(Instant consumedAt) { this.consumedAt = consumedAt; }
}
