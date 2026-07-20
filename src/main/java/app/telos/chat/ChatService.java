package app.telos.chat;

import app.telos.chat.dto.ConversationDto;
import app.telos.chat.dto.ConversationListResponse;
import app.telos.chat.dto.ConversationSummaryDto;
import app.telos.chat.dto.MessageDto;
import app.telos.common.BusinessException;
import app.telos.common.NotFoundException;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Message;
import app.telos.domain.entity.Transaction;
import app.telos.domain.entity.User;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.TxState;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.MessageRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Chat over a transaction's conversation. The two participants are the
 * borrower and lender; chat unlocks once the request is APPROVED (mirroring the
 * coordinate-unlock rule). Marking messages read is a separate, explicit call
 * (see markRead) so that fetching a conversation never has a write side effect.
 */
@Service
public class ChatService {

    /** States in which the conversation is open for messaging. */
    private static final List<TxState> CHAT_OPEN =
            List.of(TxState.APPROVED, TxState.ACTIVE, TxState.OVERDUE, TxState.RETURNED);

    private final MessageRepository messages;
    private final TransactionRepository transactions;
    private final UserRepository users;
    private final LedgerEntryRepository ledger;

    public ChatService(MessageRepository messages,
                       TransactionRepository transactions,
                       UserRepository users,
                       LedgerEntryRepository ledger) {
        this.messages = messages;
        this.transactions = transactions;
        this.users = users;
        this.ledger = ledger;
    }

    /** The Chats list: one row per transaction the user participates in that has a conversation. */
    @Transactional(readOnly = true)
    public ConversationListResponse list(String uid) {
        List<Transaction> txs = transactions.findByBorrowerIdOrLenderId(uid, uid);
        List<ConversationSummaryDto> rows = new ArrayList<>();
        for (Transaction tx : txs) {
            List<Message> msgs = messages.findByTxIdOrderByAtAsc(tx.getId());
            if (msgs.isEmpty()) continue;
            Message last = msgs.get(msgs.size() - 1);
            String cpId = counterpartyId(tx, uid);
            rows.add(new ConversationSummaryDto(
                    tx.getId(), tx.getItemTitle(), tx.getState(),
                    cpId, displayName(cpId),
                    last.getBody(), last.getAt(),
                    messages.countUnreadForUser(tx.getId(), uid)));
        }
        rows.sort(Comparator.comparing(ConversationSummaryDto::lastAt).reversed());
        return new ConversationListResponse(rows);
    }

    /** Full conversation for the Chat screen. Does not mutate; see markRead(). */
    @Transactional(readOnly = true)
    public ConversationDto conversation(String uid, String txId) {
        Transaction tx = requireParticipant(uid, txId);

        List<MessageDto> dto = new ArrayList<>();
        for (Message m : messages.findByTxIdOrderByAtAsc(txId)) {
            dto.add(toDto(m, uid));
        }

        String cpId = counterpartyId(tx, uid);
        User cp = users.findById(cpId).orElse(null);
        double escrowLocked = lockedEscrowFor(tx);

        return new ConversationDto(
                tx.getId(), tx.getItemTitle(), tx.getMode(), tx.getState(),
                cpId, cp == null ? cpId : cp.getName(),
                cp != null && cp.isVerified(),
                escrowLocked, tx.isCoordsUnlocked(), dto);
    }

    /** Marks counterparty messages in this conversation as read. */
    @Transactional
    public void markRead(String uid, String txId) {
        requireParticipant(uid, txId);
        messages.markReadForUser(txId, uid);
    }

    /** Send a message. Only allowed once the conversation is open (APPROVED+). */
    @Transactional
    public MessageDto send(String uid, String txId, String body) {
        Transaction tx = requireParticipant(uid, txId);
        if (!CHAT_OPEN.contains(tx.getState())) {
            throw new BusinessException("CHAT_LOCKED",
                    "Chat unlocks once the request is approved", HttpStatus.CONFLICT.value());
        }
        Message m = new Message();
        m.setId("msg-" + shortId());
        m.setTxId(txId);
        m.setSenderId(uid);
        m.setBody(body);
        m.setAt(Instant.now());
        m.setReadAt(null);
        messages.save(m);
        return toDto(m, uid);
    }

    // ----------------------------------------------------------------- helpers

    private Transaction requireParticipant(String uid, String txId) {
        Transaction tx = transactions.findById(txId)
                .orElseThrow(() -> new NotFoundException("Conversation not found: " + txId));
        if (!tx.getBorrowerId().equals(uid) && !tx.getLenderId().equals(uid)) {
            // Don't reveal existence to non-participants.
            throw new NotFoundException("Conversation not found: " + txId);
        }
        return tx;
    }

    private String counterpartyId(Transaction tx, String uid) {
        return tx.getBorrowerId().equals(uid) ? tx.getLenderId() : tx.getBorrowerId();
    }

    private String displayName(String userId) {
        return users.findById(userId).map(User::getName).orElse(userId);
    }

    /** Sum of the borrower's still-locked escrow for this transaction. */
    private double lockedEscrowFor(Transaction tx) {
        double sum = 0;
        for (LedgerEntry e : ledger.findByUserIdOrderByAtDesc(tx.getBorrowerId())) {
            if (tx.getId().equals(e.getTxId()) && e.getStatus() == LedgerStatus.LOCKED) {
                sum += Math.abs(e.getAmount());
            }
        }
        return sum;
    }

    private MessageDto toDto(Message m, String uid) {
        return new MessageDto(m.getId(), m.getTxId(), m.getSenderId(),
                m.getBody(), m.getAt(), m.getReadAt(), m.getSenderId().equals(uid));
    }

    private static String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
