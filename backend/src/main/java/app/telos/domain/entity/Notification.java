package app.telos.domain.entity;

import app.telos.domain.enums.NotificationType;
import jakarta.persistence.*;

import java.time.Instant;

/** An activity-feed notification for a user. */
@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @Column(length = 24)
    private String id; // e.g. "n-1"

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private NotificationType type;

    @Column(nullable = false, columnDefinition = "text")
    private String text;

    @Column(name = "at", nullable = false)
    private Instant at;

    @Column(nullable = false)
    private boolean unread;

    public Notification() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Instant getAt() { return at; }
    public void setAt(Instant at) { this.at = at; }
    public boolean isUnread() { return unread; }
    public void setUnread(boolean unread) { this.unread = unread; }
}
