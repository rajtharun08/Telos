package app.telos.handoff.dto;

import jakarta.validation.constraints.NotBlank;

/** Request body for scanning a QR handoff token. */
public record ScanRequest(@NotBlank String token) {}
