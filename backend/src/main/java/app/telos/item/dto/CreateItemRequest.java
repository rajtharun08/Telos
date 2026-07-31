package app.telos.item.dto;

import app.telos.domain.enums.Mode;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** New listing payload. Mirrors ListItem.jsx. */
public record CreateItemRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 32) String category,
        @NotNull Mode mode,
        @PositiveOrZero @DecimalMax("1000000.00") @Digits(integer = 7, fraction = 2) double price,
        @PositiveOrZero @DecimalMax("1000000.00") @Digits(integer = 7, fraction = 2) double deposit,
        String description
) {}
