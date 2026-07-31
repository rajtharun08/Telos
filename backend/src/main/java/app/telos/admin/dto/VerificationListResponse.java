package app.telos.admin.dto;

import java.util.List;

/** The verification queue plus computed dashboard metrics. */
public record VerificationListResponse(
        List<VerificationDto> items,
        AdminMetrics metrics
) {}
