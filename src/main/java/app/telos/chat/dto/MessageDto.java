package app.telos.chat.dto;

import java.time.Instant;

/** A single chat message projection. `mine` is derived per-viewer. */
public record MessageDto(
        String id,
        String txId,
        String senderId,
        String body,
        Instant at,
        Instant readAt,
        boolean mine
) {}
