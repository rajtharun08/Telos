package app.telos.notification;

import app.telos.notification.dto.NotificationFeedDto;
import app.telos.security.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Notification endpoints, scoped to the authenticated user. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    public NotificationController(NotificationService notificationService, CurrentUser currentUser) {
        this.notificationService = notificationService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public NotificationFeedDto list() {
        return notificationService.feed(currentUser.id());
    }

    @PatchMapping("/read")
    public Map<String, Object> markAllRead() {
        notificationService.markAllRead(currentUser.id());
        return Map.of("unreadCount", 0L);
    }
}
