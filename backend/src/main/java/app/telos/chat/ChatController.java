package app.telos.chat;

import app.telos.chat.dto.ConversationDto;
import app.telos.chat.dto.ConversationListResponse;
import app.telos.chat.dto.MessageDto;
import app.telos.chat.dto.SendMessageRequest;
import app.telos.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Chat endpoints. A conversation is keyed to a transaction the caller
 * participates in (borrower or lender).
 */
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService service;
    private final CurrentUser currentUser;

    public ChatController(ChatService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    /** The Chats list (one row per conversation). */
    @GetMapping
    public ConversationListResponse list() {
        return service.list(currentUser.id());
    }

    /** Full conversation for the Chat screen. Read-only; does not mark messages read. */
    @GetMapping("/{txId}")
    public ConversationDto conversation(@PathVariable String txId) {
        return service.conversation(currentUser.id(), txId);
    }

    /** Marks counterparty messages in this conversation as read. */
    @PatchMapping("/{txId}/read")
    public void markRead(@PathVariable String txId) {
        service.markRead(currentUser.id(), txId);
    }

    /** Send a message in a conversation. */
    @PostMapping("/{txId}/messages")
    public ResponseEntity<MessageDto> send(@PathVariable String txId,
                                           @Valid @RequestBody SendMessageRequest req) {
        MessageDto body = service.send(currentUser.id(), txId, req.body());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
}
