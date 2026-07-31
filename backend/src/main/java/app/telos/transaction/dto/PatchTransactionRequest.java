package app.telos.transaction.dto;

import jakarta.validation.constraints.NotBlank;

public record PatchTransactionRequest(@NotBlank String toState) {}
