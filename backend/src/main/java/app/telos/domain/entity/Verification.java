package app.telos.domain.entity;

import app.telos.domain.enums.VerificationKind;
import app.telos.domain.enums.VerificationStatus;
import jakarta.persistence.*;

import java.time.Instant;

/** An admin verification-queue item (KYC document or payment receipt). */
@Entity
@Table(name = "verification")
public class Verification {

    @Id
    @Column(length = 24)
    private String id; // e.g. "vq-1"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private VerificationKind kind;

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    /** Dollar amount for RECEIPT items; null for KYC. */
    private Double amount;

    @Column(nullable = false)
    private String doc;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private VerificationStatus status = VerificationStatus.PENDING;

    /** For RECEIPT items: the ledger entry whose funds clear on approval. */
    @Column(name = "ledger_id", length = 24)
    private String ledgerId;

    public Verification() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public VerificationKind getKind() { return kind; }
    public void setKind(VerificationKind kind) { this.kind = kind; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getDoc() { return doc; }
    public void setDoc(String doc) { this.doc = doc; }
    public VerificationStatus getStatus() { return status; }
    public void setStatus(VerificationStatus status) { this.status = status; }
    public String getLedgerId() { return ledgerId; }
    public void setLedgerId(String ledgerId) { this.ledgerId = ledgerId; }
}
