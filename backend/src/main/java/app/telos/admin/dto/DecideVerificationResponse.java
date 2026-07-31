package app.telos.admin.dto;

import app.telos.domain.enums.VerificationStatus;

/** Result of an admin decision; clearedAmount present when a RECEIPT was approved. */
public record DecideVerificationResponse(
        String id,
        VerificationStatus status,
        Double clearedAmount
) {}
