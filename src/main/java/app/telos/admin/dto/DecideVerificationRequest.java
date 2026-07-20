package app.telos.admin.dto;

import jakarta.validation.constraints.NotBlank;

/** Admin decision on a verification item: APPROVED or REJECTED. */
public record DecideVerificationRequest(@NotBlank String decision) {}
