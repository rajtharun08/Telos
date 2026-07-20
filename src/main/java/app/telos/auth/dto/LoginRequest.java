package app.telos.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Credentials for POST /api/auth/login. */
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {}
