package app.telos.repo;

import app.telos.domain.entity.Item;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, String> {

    /** Serialize request creation for a listing across all application instances. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Item i WHERE i.id = :id")
    Optional<Item> findByIdForUpdate(@Param("id") String id);

    /**
     * PostGIS radial discovery from a viewer point, ordered ascending by distance.
     * Uses ST_DWithin on geography (meters) so radiusKm is multiplied by 1000.
     * Mode/category filters are applied with null-safe SQL ("ALL" passes null).
     *
     * Returns ordered rows of [String id, Number distanceKm]. The service loads
     * the Item entities by id and zips them with the distance, so callers get a
     * clean two-column projection instead of a sprawling SELECT i.* row.
     *
     * The :viewer JTS Point is bound as geometry(4326) by hibernate-spatial and
     * cast to geography here so it lines up with the geography(Point,4326) column.
     */
    @Query(value = """
            SELECT i.id AS id,
                   ST_Distance(i.geom, CAST(:viewer AS geography)) / 1000.0 AS distance_km
            FROM item i
            WHERE ST_DWithin(i.geom, CAST(:viewer AS geography), :radiusMeters)
              AND (:mode IS NULL OR i.mode = :mode)
              AND (:category IS NULL OR i.category = :category)
            ORDER BY distance_km ASC
            """, nativeQuery = true)
    List<Object[]> findWithinRadius(@Param("viewer") org.locationtech.jts.geom.Point viewer,
                                    @Param("radiusMeters") double radiusMeters,
                                    @Param("mode") String mode,
                                    @Param("category") String category);

    List<Item> findByOwnerId(String ownerId);
}
