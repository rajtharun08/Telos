package app.telos.transaction.dto;

import app.telos.domain.enums.Mode;
import app.telos.domain.enums.Role;
import app.telos.domain.enums.TxState;

import java.time.Instant;

/** Per-viewer transaction projection. role/counterpartyId are derived for the requesting user. */
public record TransactionDto(
        String id,
        String itemId,
        String itemTitle,
        Role role,
        String counterpartyId,
        Mode mode,
        TxState state,
        double fee,
        double deposit,
        int days,
        Double lateFee,
        Instant createdAt,
        Instant dueAt,
        Instant returnedAt,
        boolean coordsUnlocked
) {}
