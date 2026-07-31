package app.telos.chat.dto;

import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;

import java.util.List;

/**
 * Full conversation view for the Chat screen. Carries the counterparty header,
 * the escrow banner figures, the transaction state (drives "Proceed to
 * Handover"), and the ordered message list.
 */
public record ConversationDto(
        String txId,
        String itemTitle,
        Mode mode,
        TxState state,
        String counterpartyId,
        String counterpartyName,
        boolean counterpartyVerified,
        double escrowLocked,
        boolean coordsUnlocked,
        List<MessageDto> messages
) {}
