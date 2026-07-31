package app.telos.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Send-message payload. */
public record SendMessageRequest(
        @NotBlank @Size(max = 2000) String body
) {}
