package app.telos.domain.entity;

import jakarta.persistence.*;

/**
 * Per-user multi-split escrow wallet. One row per user.
 * available + locked are spendable/held; earned + pendingClear are informational
 * splits mirrored from the frontend wallet shape.
 */
@Entity
@Table(name = "wallet")
public class Wallet {

    @Id
    @Column(name = "user_id", length = 16)
    private String userId;

    @Column(nullable = false)
    private double available;

    @Column(nullable = false)
    private double locked;

    @Column(nullable = false)
    private double earned;

    @Column(name = "pending_clear", nullable = false)
    private double pendingClear;

    @Version
    private long version;

    public Wallet() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public double getAvailable() { return available; }
    public void setAvailable(double available) { this.available = available; }
    public double getLocked() { return locked; }
    public void setLocked(double locked) { this.locked = locked; }
    public double getEarned() { return earned; }
    public void setEarned(double earned) { this.earned = earned; }
    public double getPendingClear() { return pendingClear; }
    public void setPendingClear(double pendingClear) { this.pendingClear = pendingClear; }
    public long getVersion() { return version; }
    public void setVersion(long version) { this.version = version; }
}
