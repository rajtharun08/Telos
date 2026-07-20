package app.telos.auth.dto;

import app.telos.domain.entity.User;
import app.telos.domain.enums.KycStatus;

import java.time.LocalDate;

/** Full profile of the authenticated user. Never leaks homeGeom or passwordHash. */
public record UserProfileDto(
        String id,
        String name,
        String email,
        String neighborhood,
        LocalDate joined,
        double rating,
        int reviews,
        boolean verified,
        KycStatus kycStatus
) {
    public static UserProfileDto from(User u) {
        return new UserProfileDto(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getNeighborhood(),
                u.getJoined(),
                u.getRating(),
                u.getReviews(),
                u.isVerified(),
                u.getKycStatus()
        );
    }
}
