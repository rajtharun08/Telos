package app.telos.repo;

import app.telos.domain.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {

    /** All messages in a transaction's conversation, oldest first. */
    List<Message> findByTxIdOrderByAtAsc(String txId);

    /** Count unread messages addressed to a user (sent by the counterparty). */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.txId = :txId AND m.senderId <> :uid AND m.readAt IS NULL")
    long countUnreadForUser(@Param("txId") String txId, @Param("uid") String uid);

    /** Mark all messages in a conversation that were sent TO this user as read. */
    @Modifying
    @Query("UPDATE Message m SET m.readAt = CURRENT_TIMESTAMP WHERE m.txId = :txId AND m.senderId <> :uid AND m.readAt IS NULL")
    void markReadForUser(@Param("txId") String txId, @Param("uid") String uid);
}
