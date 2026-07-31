package app.telos.wallet.dto;

import app.telos.domain.enums.LedgerStatus;

public record TopupResponse(String ledgerId, LedgerStatus status, double pendingClear) {}
