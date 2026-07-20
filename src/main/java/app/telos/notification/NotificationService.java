package app.telos.notification;

import app.telos.notification.dto.NotificationDto;
import app.telos.notification.dto.NotificationFeedDto;
import app.telos.repo.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Activity-feed reads and read-state mutations, scoped to one user. */
@Service
public class NotificationService {

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    /** Full feed (newest first) plus the unread count for the given user. */
    @Transactional(readOnly = true)
    public NotificationFeedDto feed(String userId) {
        List<NotificationDto> items = notifications.findByUserIdOrderByAtDesc(userId)
                .stream()
                .map(NotificationDto::from)
                .toList();
        long unreadCount = notifications.countByUserIdAndUnreadTrue(userId);
        return new NotificationFeedDto(unreadCount, items);
    }

    /** Mark every notification for the user as read. */
    @Transactional
    public void markAllRead(String userId) {
        notifications.markAllRead(userId);
    }
}
