package app.telos.admin.dto;

import app.telos.domain.enums.VerificationKind;
import app.telos.domain.enums.VerificationStatus;

import java.time.Instant;

/** A verification-queue projection. */
public record VerificationDto(
        String id,
        VerificationKind kind,
        String userId,
        Instant submittedAt,
        Double amount,
        String doc,
        VerificationStatus status
) {}
