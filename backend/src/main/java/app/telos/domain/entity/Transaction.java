package app.telos.domain.entity;

import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * A transaction record spanning the rental lifecycle. The lender and borrower
 * are explicit; the frontend's per-viewer "role" field is derived at read time.
 */
@Entity
@Table(name = "tx")
public class Transaction {

    @Id
    @Column(length = 24)
    private String id; // e.g. "tx-1001"

    @Column(name = "item_id", nullable = false, length = 16)
    private String itemId;

    @Column(name = "item_title", nullable = false)
    private String itemTitle;

    @Column(name = "borrower_id", nullable = false, length = 16)
    private String borrowerId;

    @Column(name = "lender_id", nullable = false, length = 16)
    private String lenderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Mode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TxState state;

    @Column(nullable = false)
    private double fee;

    @Column(nullable = false)
    private double deposit;

    @Column(nullable = false)
    private int days;

    @Column(name = "late_fee")
    private Double lateFee;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "returned_at")
    private Instant returnedAt;

    @Column(name = "coords_unlocked", nullable = false)
    private boolean coordsUnlocked;

    public Transaction() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }
    public String getItemTitle() { return itemTitle; }
    public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }
    public String getBorrowerId() { return borrowerId; }
    public void setBorrowerId(String borrowerId) { this.borrowerId = borrowerId; }
    public String getLenderId() { return lenderId; }
    public void setLenderId(String lenderId) { this.lenderId = lenderId; }
    public Mode getMode() { return mode; }
    public void setMode(Mode mode) { this.mode = mode; }
    public TxState getState() { return state; }
    public void setState(TxState state) { this.state = state; }
    public double getFee() { return fee; }
    public void setFee(double fee) { this.fee = fee; }
    public double getDeposit() { return deposit; }
    public void setDeposit(double deposit) { this.deposit = deposit; }
    public int getDays() { return days; }
    public void setDays(int days) { this.days = days; }
    public Double getLateFee() { return lateFee; }
    public void setLateFee(Double lateFee) { this.lateFee = lateFee; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
    public Instant getReturnedAt() { return returnedAt; }
    public void setReturnedAt(Instant returnedAt) { this.returnedAt = returnedAt; }
    public boolean isCoordsUnlocked() { return coordsUnlocked; }
    public void setCoordsUnlocked(boolean coordsUnlocked) { this.coordsUnlocked = coordsUnlocked; }
}
