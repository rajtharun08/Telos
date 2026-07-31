package app.telos.transaction;

import app.telos.common.BusinessException;
import app.telos.domain.enums.TxState;
import app.telos.security.CurrentUser;
import app.telos.transaction.dto.CreateTransactionRequest;
import app.telos.transaction.dto.CreateTransactionResponse;
import app.telos.transaction.dto.PatchTransactionRequest;
import app.telos.transaction.dto.PatchTransactionResponse;
import app.telos.transaction.dto.TransactionListResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;
    private final CurrentUser currentUser;

    public TransactionController(TransactionService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public TransactionListResponse list(@RequestParam(required = false) String role,
                                        @RequestParam(required = false) String status) {
        return service.list(currentUser.id(), role, status);
    }

    @PostMapping
    public ResponseEntity<CreateTransactionResponse> create(@Valid @RequestBody CreateTransactionRequest req) {
        int days = req.days() == null ? 1 : req.days();
        CreateTransactionResponse body = service.create(currentUser.id(), req.itemId(), days);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PatchMapping("/{id}")
    public PatchTransactionResponse patch(@PathVariable String id,
                                          @Valid @RequestBody PatchTransactionRequest req) {
        TxState toState = parseState(req.toState());
        return service.transition(currentUser.id(), id, toState);
    }

    private static TxState parseState(String value) {
        if (value == null || value.isBlank()) {
            throw invalidState();
        }
        try {
            return TxState.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw invalidState();
        }
    }

    private static BusinessException invalidState() {
        return new BusinessException("INVALID_STATE",
                "Unknown transaction target state", HttpStatus.BAD_REQUEST.value());
    }
}
