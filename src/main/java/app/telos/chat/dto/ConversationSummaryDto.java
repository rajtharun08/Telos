package app.telos.chat.dto;

import app.telos.domain.enums.TxState;

import java.time.Instant;

/** A row in the Chats list: counterparty, last message preview, unread count. */
public record ConversationSummaryDto(
        String txId,
        String itemTitle,
        TxState state,
        String counterpartyId,
        String counterpartyName,
        String lastMessage,
        Instant lastAt,
        long unread
) {}
