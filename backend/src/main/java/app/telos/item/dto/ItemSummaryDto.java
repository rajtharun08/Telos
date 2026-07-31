package app.telos.item.dto;

import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;

/**
 * Discovery list projection. Mirrors the frontend item card shape.
 * NEVER includes exact coordinates — only the obfuscated offset{x,y} (km from
 * the viewer), textual vicinity, distanceKm, and coordsUnlocked (always false
 * in discovery; exact location unlocks per-transaction after APPROVED).
 */
public record ItemSummaryDto(
        String id,
        String title,
        String category,
        String ownerId,
        Mode mode,
        TxState state,
        double price,
        double deposit,
        double distanceKm,
        Offset offset,
        String vicinity,
        boolean coordsUnlocked,
        double rating,
        int reviews,
        String image
) {
    /** Relative position from the viewer, in km. */
    public record Offset(double x, double y) {}
}
