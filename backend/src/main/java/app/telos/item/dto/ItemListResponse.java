package app.telos.item.dto;

import java.util.List;

/** Discovery response: echoes the radius and the matched items (distance-sorted). */
public record ItemListResponse(
        double radiusKm,
        int count,
        List<ItemSummaryDto> items
) {}
