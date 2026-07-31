package app.telos.item;

import app.telos.common.BusinessException;
import app.telos.common.MoneyPolicy;
import app.telos.common.NotFoundException;
import app.telos.domain.entity.Item;
import app.telos.domain.entity.User;
import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;
import app.telos.item.dto.CreateItemResponse;
import app.telos.item.dto.ItemDetailDto;
import app.telos.item.dto.ItemListResponse;
import app.telos.item.dto.ItemSummaryDto;
import app.telos.repo.ItemRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Items + discovery slice.
 *
 * Discovery is a real PostGIS ST_DWithin radial query from the authenticated
 * user's home_geom. The viewer-relative offset{x,y} (km) the RadialMap renders
 * is reconstructed from the JTS points using the same degrees-per-km factors the
 * seed used (1 deg lat = 111.32 km; 1 deg lng = 88.0 km at this latitude), so it
 * round-trips with mockData. Exact coordinates are NEVER serialized: discovery
 * always reports coordsUnlocked=false, and item detail only flips it true when
 * the viewer has a non-pending transaction for that item.
 */
@Service
public class ItemService {

    /** Degrees-per-km factors (must match V2__seed.sql). */
    private static final double KM_PER_DEG_LAT = 111.32;
    private static final double KM_PER_DEG_LNG = 88.0;

    /** States in which a borrower has earned the exact location. */
    private static final List<TxState> UNLOCK_STATES =
            List.of(TxState.APPROVED, TxState.ACTIVE, TxState.OVERDUE, TxState.RETURNED);

    private final ItemRepository items;
    private final UserRepository users;
    private final TransactionRepository transactions;
    private final GeometryFactory geometryFactory =
            new GeometryFactory(new PrecisionModel(), 4326);

    public ItemService(ItemRepository items, UserRepository users, TransactionRepository transactions) {
        this.items = items;
        this.users = users;
        this.transactions = transactions;
    }

    @Transactional(readOnly = true)
    public ItemListResponse discover(String uid, double radiusKm, String mode, String category) {
        User viewer = users.findById(uid)
                .orElseThrow(() -> new NotFoundException("User not found: " + uid));
        Point home = viewer.getHomeGeom();
        if (home == null) {
            // No home location: nothing to anchor discovery on.
            return new ItemListResponse(radiusKm, 0, List.of());
        }

        String modeFilter = normalizeFilter(mode);
        String categoryFilter = normalizeFilter(category);

        List<Object[]> rows = items.findWithinRadius(
                home, radiusKm * 1000.0, modeFilter, categoryFilter);

        // Preserve distance order; load entities in one batch and zip back.
        List<String> ids = rows.stream().map(r -> (String) r[0]).toList();
        Map<String, Item> byId = items.findAllById(ids).stream()
                .collect(Collectors.toMap(Item::getId, i -> i));

        List<ItemSummaryDto> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            String id = (String) row[0];
            double distanceKm = ((Number) row[1]).doubleValue();
            Item item = byId.get(id);
            if (item == null) continue; // skip own listings the owner doesn't see? kept for safety
            out.add(toSummary(item, home, round2(distanceKm)));
        }
        return new ItemListResponse(radiusKm, out.size(), out);
    }

    @Transactional(readOnly = true)
    public ItemDetailDto detail(String uid, String itemId) {
        Item item = items.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found: " + itemId));
        User viewer = users.findById(uid).orElse(null);
        Point home = viewer == null ? null : viewer.getHomeGeom();

        boolean unlocked = item.getOwnerId().equals(uid)
                || transactions.existsByItemIdAndBorrowerIdAndStateIn(itemId, uid, UNLOCK_STATES);

        double distanceKm = 0;
        ItemSummaryDto.Offset offset = new ItemSummaryDto.Offset(0, 0);
        if (home != null && item.getGeom() != null) {
            offset = offsetKm(home, item.getGeom());
            distanceKm = round2(haversineKm(home, item.getGeom()));
        }

        // Materialize the lazy specs collection inside the transaction so Jackson
        // can serialize it after the session closes (avoids LazyInitializationException).
        List<String> specs = new ArrayList<>(item.getSpecs());

        return new ItemDetailDto(
                item.getId(), item.getTitle(), item.getCategory(), item.getOwnerId(),
                item.getMode(), item.getState(), item.getPrice(), item.getDeposit(),
                distanceKm, offset, item.getVicinity(), unlocked,
                item.getRating(), item.getReviews(), item.getDescription(),
                specs, item.getImage());
    }

    @Transactional
    public CreateItemResponse create(String uid, String title, String category, Mode mode,
                                     double price, double deposit, String description) {
        price = MoneyPolicy.requireNonNegative(price, "price");
        deposit = MoneyPolicy.requireNonNegative(deposit, "deposit");
        if (title == null || title.isBlank() || title.length() > 255
                || category == null || category.isBlank() || category.length() > 32) {
            throw new BusinessException("INVALID_LISTING",
                    "Listing title or category is invalid", HttpStatus.BAD_REQUEST.value());
        }
        User owner = users.findById(uid)
                .orElseThrow(() -> new NotFoundException("User not found: " + uid));

        Item item = new Item();
        item.setId("it-" + shortId());
        item.setTitle(title);
        item.setCategory(category);
        item.setOwnerId(uid);
        item.setMode(mode);
        item.setState(TxState.AVAILABLE);
        item.setPrice(mode == Mode.BORROW ? 0.0 : price);
        item.setDeposit(deposit);
        // New listings inherit the owner's home location so they appear on the map.
        item.setGeom(owner.getHomeGeom());
        item.setVicinity(owner.getNeighborhood());
        item.setDescription(description);
        item.setRating(0);
        item.setReviews(0);
        item.setImage("linear-gradient(135deg,#64748b,#1e293b)");
        items.save(item);

        return new CreateItemResponse(
                item.getId(), item.getTitle(), item.getCategory(), item.getOwnerId(),
                item.getMode(), item.getState(), item.getPrice(), item.getDeposit(),
                item.getDescription(), item.getSpecs(), item.getImage());
    }

    private ItemSummaryDto toSummary(Item item, Point home, double distanceKm) {
        ItemSummaryDto.Offset offset = offsetKm(home, item.getGeom());
        return new ItemSummaryDto(
                item.getId(), item.getTitle(), item.getCategory(), item.getOwnerId(),
                item.getMode(), item.getState(), item.getPrice(), item.getDeposit(),
                distanceKm, offset, item.getVicinity(), false,
                item.getRating(), item.getReviews(), item.getImage());
    }

    /** Reconstruct the viewer-relative offset in km (inverse of the seed math). */
    private ItemSummaryDto.Offset offsetKm(Point home, Point item) {
        if (home == null || item == null) return new ItemSummaryDto.Offset(0, 0);
        double dx = (item.getX() - home.getX()) * KM_PER_DEG_LNG; // lng delta -> km east
        double dy = (item.getY() - home.getY()) * KM_PER_DEG_LAT; // lat delta -> km north
        return new ItemSummaryDto.Offset(round2(dx), round2(dy));
    }

    /** Local great-circle distance for the detail view (discovery uses PostGIS). */
    private double haversineKm(Point a, Point b) {
        double r = 6371.0;
        double dLat = Math.toRadians(b.getY() - a.getY());
        double dLng = Math.toRadians(b.getX() - a.getX());
        double lat1 = Math.toRadians(a.getY());
        double lat2 = Math.toRadians(b.getY());
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
        return 2 * r * Math.asin(Math.min(1.0, Math.sqrt(h)));
    }

    private static String normalizeFilter(String v) {
        if (v == null || v.isBlank() || v.equalsIgnoreCase("ALL") || v.equalsIgnoreCase("all")) {
            return null;
        }
        return v;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
