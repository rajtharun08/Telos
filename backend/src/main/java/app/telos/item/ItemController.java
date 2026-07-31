package app.telos.item;

import app.telos.item.dto.CategoryDto;
import app.telos.item.dto.CreateItemRequest;
import app.telos.item.dto.CreateItemResponse;
import app.telos.item.dto.ItemDetailDto;
import app.telos.item.dto.ItemListResponse;
import app.telos.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Items, discovery, and categories.
 *
 * GET  /api/items            radial discovery (radiusKm, mode, category, sort)
 * GET  /api/items/{id}       single item detail (per-viewer coordsUnlocked)
 * POST /api/items            create a listing (enters AVAILABLE, owned by caller)
 * GET  /api/categories       static category list (public)
 */
@RestController
public class ItemController {

    private final ItemService service;
    private final CurrentUser currentUser;

    public ItemController(ItemService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping("/api/items")
    public ItemListResponse discover(@RequestParam(defaultValue = "5") double radiusKm,
                                     @RequestParam(required = false) String mode,
                                     @RequestParam(required = false) String category,
                                     @RequestParam(required = false) String sort) {
        // sort is accepted for contract compatibility; discovery is always
        // distance-ascending (enforced server-side by the PostGIS ORDER BY).
        return service.discover(currentUser.id(), radiusKm, mode, category);
    }

    @GetMapping("/api/items/{id}")
    public ItemDetailDto detail(@PathVariable String id) {
        return service.detail(currentUser.id(), id);
    }

    @PostMapping("/api/items")
    public ResponseEntity<CreateItemResponse> create(@Valid @RequestBody CreateItemRequest req) {
        CreateItemResponse body = service.create(
                currentUser.id(), req.title(), req.category(), req.mode(),
                req.price(), req.deposit(), req.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/api/categories")
    public List<CategoryDto> categories() {
        return Categories.ALL;
    }
}
