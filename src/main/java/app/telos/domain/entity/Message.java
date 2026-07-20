package app.telos.domain.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * A chat message within a transaction's conversation. The conversation is keyed
 * to a transaction (borrower + lender are the only participants); chat unlocks
 * once the request is APPROVED, mirroring the coordinate-unlock rule.
 */
@Entity
@Table(name = "message")
public class Message {

    @Id
    @Column(length = 24)
    private String id; // e.g. "msg-...."

    @Column(name = "tx_id", nullable = false, length = 24)
    private String txId;

    @Column(name = "sender_id", nullable = false, length = 16)
    private String senderId;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(name = "at", nullable = false)
    private Instant at;

    @Column(name = "read_at")
    private Instant readAt;

    public Message() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTxId() { return txId; }
    public void setTxId(String txId) { this.txId = txId; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public Instant getAt() { return at; }
    public void setAt(Instant at) { this.at = at; }
    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
}
