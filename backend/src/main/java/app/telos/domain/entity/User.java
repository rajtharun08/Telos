package app.telos.domain.entity;

import app.telos.domain.enums.KycStatus;
import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

import java.time.LocalDate;

/** A Telos resident. Mirrors mockData currentUser / neighbors shape. */
@Entity
@Table(name = "app_user")
public class User {

    @Id
    @Column(length = 16)
    private String id; // e.g. "u-001"

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    /** Bcrypt hash. Null for seeded neighbors who never log in. */
    @Column(name = "password_hash")
    private String passwordHash;

    private String neighborhood;

    private LocalDate joined;

    @Column(nullable = false)
    private double rating;

    @Column(nullable = false)
    private int reviews;

    @Column(nullable = false)
    private boolean verified;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false, length = 16)
    private KycStatus kycStatus = KycStatus.PENDING;

    /** Grants access to /api/admin/** routes. */
    @Column(nullable = false)
    private boolean admin = false;

    /** PostGIS geography(Point,4326): the user's home location, used as the
     *  viewer origin for radial discovery. Server-only; never serialized raw. */
    @Column(name = "home_geom", columnDefinition = "geography(Point,4326)")
    private Point homeGeom;

    public User() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getNeighborhood() { return neighborhood; }
    public void setNeighborhood(String neighborhood) { this.neighborhood = neighborhood; }
    public LocalDate getJoined() { return joined; }
    public void setJoined(LocalDate joined) { this.joined = joined; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public int getReviews() { return reviews; }
    public void setReviews(int reviews) { this.reviews = reviews; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public KycStatus getKycStatus() { return kycStatus; }
    public void setKycStatus(KycStatus kycStatus) { this.kycStatus = kycStatus; }
    public boolean isAdmin() { return admin; }
    public void setAdmin(boolean admin) { this.admin = admin; }
    public Point getHomeGeom() { return homeGeom; }
    public void setHomeGeom(Point homeGeom) { this.homeGeom = homeGeom; }
}
