package app.telos.wallet.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record TopupRequest(
        @NotNull @Positive @DecimalMax("1000000.00") @Digits(integer = 7, fraction = 2) Double amount,
        @NotBlank @Size(max = 248) String receiptRef
) {}
