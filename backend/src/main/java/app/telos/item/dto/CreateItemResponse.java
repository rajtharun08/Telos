package app.telos.item.dto;

import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;

import java.util.List;

/** Created-listing echo. The new item enters AVAILABLE owned by the caller. */
public record CreateItemResponse(
        String id,
        String title,
        String category,
        String ownerId,
        Mode mode,
        TxState state,
        double price,
        double deposit,
        String description,
        List<String> specs,
        String image
) {}
