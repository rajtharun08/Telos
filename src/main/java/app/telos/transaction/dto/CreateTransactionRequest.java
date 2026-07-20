package app.telos.transaction.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateTransactionRequest(
        @NotBlank String itemId,
        @Min(1) @Max(365) Integer days
) {}
