package app.telos.user.dto;

import app.telos.domain.entity.User;

import java.time.LocalDate;

/** Public-facing profile of any resident. Excludes email, kyc, and homeGeom. */
public record PublicProfileDto(
        String id,
        String name,
        double rating,
        int reviews,
        boolean verified,
        LocalDate joined
) {
    public static PublicProfileDto from(User u) {
        return new PublicProfileDto(
                u.getId(),
                u.getName(),
                u.getRating(),
                u.getReviews(),
                u.isVerified(),
                u.getJoined()
        );
    }
}
