package app.telos.admin.dto;

/** Aggregate dashboard metrics for the admin console. */
public record AdminMetrics(
        long activeRentals,
        double escrowHeld,
        long pendingVerifications,
        double disputeRate,
        double gmv,
        long newUsers7d
) {}
