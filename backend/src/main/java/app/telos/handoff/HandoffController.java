package app.telos.handoff;

import app.telos.handoff.dto.MintTokenResponse;
import app.telos.handoff.dto.ScanRequest;
import app.telos.handoff.dto.ScanResponse;
import app.telos.security.CurrentUser;
import app.telos.security.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * QR handoff endpoints. Mints single-use, time-limited tokens for a transaction
 * and redeems scanned tokens to advance the lifecycle (APPROVED -> ACTIVE on
 * pickup, ACTIVE/OVERDUE -> RETURNED on return, settling escrow).
 */
@RestController
@RequestMapping("/api/handoff")
public class HandoffController {

    private final HandoffService service;
    private final CurrentUser currentUser;
    private final RateLimitService rateLimits;

    public HandoffController(HandoffService service,
                             CurrentUser currentUser,
                             RateLimitService rateLimits) {
        this.service = service;
        this.currentUser = currentUser;
        this.rateLimits = rateLimits;
    }

    @PostMapping("/{transactionId}/token")
    public ResponseEntity<MintTokenResponse> mint(@PathVariable String transactionId,
                                                   HttpServletRequest request) {
        String uid = currentUser.id();
        rateLimits.check("handoff-mint",
                uid + ':' + transactionId + ':' + request.getRemoteAddr(),
                10, Duration.ofMinutes(1));
        MintTokenResponse body = service.mint(uid, transactionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/scan")
    public ScanResponse scan(@Valid @RequestBody ScanRequest req,
                             HttpServletRequest request) {
        String uid = currentUser.id();
        rateLimits.check("handoff-scan", uid + ':' + request.getRemoteAddr(),
                30, Duration.ofMinutes(1));
        return service.scan(uid, req.token());
    }
}
