package app.telos.auth.dto;

/** Response for login/signup: a bearer token plus the authenticated profile. */
public record AuthResponse(
        String token,
        UserProfileDto user
) {}
