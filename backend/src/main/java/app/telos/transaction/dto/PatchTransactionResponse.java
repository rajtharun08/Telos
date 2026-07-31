package app.telos.transaction.dto;

import app.telos.domain.enums.TxState;

public record PatchTransactionResponse(String id, TxState state, boolean coordsUnlocked) {}
