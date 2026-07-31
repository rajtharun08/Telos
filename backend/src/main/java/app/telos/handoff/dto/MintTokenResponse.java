package app.telos.handoff.dto;

import java.time.Instant;

/** Response to minting a single-use QR handoff token. */
public record MintTokenResponse(
        String transactionId,
        String token,
        String phase,
        int expiresInSec,
        Instant expiresAt
) {}
