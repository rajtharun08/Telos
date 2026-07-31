package app.telos.notification.dto;

import app.telos.domain.entity.Notification;
import app.telos.domain.enums.NotificationType;

import java.time.Instant;

/** A single activity-feed item. */
public record NotificationDto(
        String id,
        NotificationType type,
        String text,
        Instant at,
        boolean unread
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getType(),
                n.getText(),
                n.getAt(),
                n.isUnread()
        );
    }
}
