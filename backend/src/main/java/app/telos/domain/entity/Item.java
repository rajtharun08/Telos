package app.telos.domain.entity;

import app.telos.domain.enums.Mode;
import app.telos.domain.enums.TxState;
import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

import java.util.ArrayList;
import java.util.List;

/**
 * A listing. Holds a real PostGIS geography point (geom) used for ST_DWithin
 * radial discovery. The exact coordinates are never serialized to clients;
 * only an obfuscated offset/vicinity is exposed until a transaction is APPROVED.
 */
@Entity
@Table(name = "item")
public class Item {

    @Id
    @Column(length = 16)
    private String id; // e.g. "it-01"

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(name = "owner_id", nullable = false, length = 16)
    private String ownerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Mode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TxState state = TxState.AVAILABLE;

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private double deposit;

    /** PostGIS geography(Point,4326). Server-only; never serialized raw. */
    @Column(columnDefinition = "geography(Point,4326)")
    private Point geom;

    private String vicinity;

    @Column(columnDefinition = "text")
    private String description;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "item_spec", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "spec")
    private List<String> specs = new ArrayList<>();

    private double rating;
    private int reviews;

    /** CSS gradient string used by the frontend card art. */
    private String image;

    public Item() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    public Mode getMode() { return mode; }
    public void setMode(Mode mode) { this.mode = mode; }
    public TxState getState() { return state; }
    public void setState(TxState state) { this.state = state; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public double getDeposit() { return deposit; }
    public void setDeposit(double deposit) { this.deposit = deposit; }
    public Point getGeom() { return geom; }
    public void setGeom(Point geom) { this.geom = geom; }
    public String getVicinity() { return vicinity; }
    public void setVicinity(String vicinity) { this.vicinity = vicinity; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getSpecs() { return specs; }
    public void setSpecs(List<String> specs) { this.specs = specs; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public int getReviews() { return reviews; }
    public void setReviews(int reviews) { this.reviews = reviews; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}
