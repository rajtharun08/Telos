package app.telos.handoff.dto;

import app.telos.domain.enums.TxState;

import java.time.Instant;

/** Result of a successful scan: the advanced state, and returnedAt when returned. */
public record ScanResponse(
        String transactionId,
        TxState state,
        Instant returnedAt
) {}
