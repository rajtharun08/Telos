package app.telos.transaction.dto;

import app.telos.domain.enums.Mode;
import app.telos.domain.enums.Role;
import app.telos.domain.enums.TxState;

import java.time.Instant;

/** The created transaction DTO (flattened) plus a wallet balance echo. */
public record CreateTransactionResponse(
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
        boolean coordsUnlocked,
        WalletEcho wallet
) {}
