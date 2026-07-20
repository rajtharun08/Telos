package app.telos.wallet.dto;

import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;

import java.time.Instant;

public record LedgerEntryDto(
        String id,
        LedgerType type,
        String label,
        double amount,
        Instant at,
        LedgerStatus status
) {}
