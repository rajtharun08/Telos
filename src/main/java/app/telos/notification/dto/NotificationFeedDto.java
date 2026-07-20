package app.telos.notification.dto;

import java.util.List;

/** GET /api/notifications response: unread count plus the full feed. */
public record NotificationFeedDto(
        long unreadCount,
        List<NotificationDto> items
) {}
