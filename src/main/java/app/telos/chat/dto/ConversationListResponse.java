package app.telos.chat.dto;

import java.util.List;

/** The Chats list response. */
public record ConversationListResponse(List<ConversationSummaryDto> items) {}
