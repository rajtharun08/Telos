package app.telos.wallet;

import app.telos.security.CurrentUser;
import app.telos.wallet.dto.TopupRequest;
import app.telos.wallet.dto.TopupResponse;
import app.telos.wallet.dto.WalletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;
    private final CurrentUser currentUser;

    public WalletController(WalletService walletService, CurrentUser currentUser) {
        this.walletService = walletService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public WalletResponse get() {
        return walletService.get(currentUser.id());
    }

    @PostMapping("/topups")
    public ResponseEntity<TopupResponse> topup(@Valid @RequestBody TopupRequest req) {
        TopupResponse body = walletService.topup(currentUser.id(), req.amount(), req.receiptRef());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }
}
