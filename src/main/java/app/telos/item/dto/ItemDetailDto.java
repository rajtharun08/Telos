package app.telos.item.dto;

import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;

import java.util.List;

/**
 * Single-item detail projection. Adds description + specs to the summary shape.
 * Still obfuscated: exposes offset/vicinity/distanceKm, never raw coordinates.
 */
public record ItemDetailDto(
        String id,
        String title,
        String category,
        String ownerId,
        Mode mode,
        TxState state,
        double price,
        double deposit,
        double distanceKm,
        ItemSummaryDto.Offset offset,
        String vicinity,
        boolean coordsUnlocked,
        double rating,
        int reviews,
        String description,
        List<String> specs,
        String image
) {}
