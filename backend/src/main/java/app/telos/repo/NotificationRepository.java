package app.telos.repo;

import app.telos.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByAtDesc(String userId);
    long countByUserIdAndUnreadTrue(String userId);

    @Modifying
    @Query("UPDATE Notification n SET n.unread = false WHERE n.userId = :userId")
    void markAllRead(@Param("userId") String userId);
}
