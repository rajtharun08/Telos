package app.telos.admin;

import app.telos.admin.dto.AdminMetrics;
import app.telos.admin.dto.DecideVerificationRequest;
import app.telos.admin.dto.DecideVerificationResponse;
import app.telos.admin.dto.VerificationListResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin verification queue + dashboard metrics. Routes under /api/admin/**
 * are guarded by ROLE_ADMIN in SecurityConfig, so no per-method auth check
 * is needed here.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    @GetMapping("/verifications")
    public VerificationListResponse list(@RequestParam(required = false) String status) {
        return service.list(status);
    }

    @PatchMapping("/verifications/{id}")
    public DecideVerificationResponse decide(@PathVariable String id,
                                             @Valid @RequestBody DecideVerificationRequest req) {
        return service.decide(id, req.decision());
    }

    /**
     * Standalone dashboard metrics (GMV, escrow held, active rentals, etc.)
     * without paying the cost of pulling the full verification queue. Same
     * aggregate this endpoint's sibling embeds in the verification list
     * response — added so dashboard widgets can poll it independently.
     */
    @GetMapping("/metrics")
    public AdminMetrics metrics() {
        return service.metrics();
    }
}
