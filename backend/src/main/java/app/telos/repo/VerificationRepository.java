package app.telos.repo;

import app.telos.domain.entity.Verification;
import app.telos.domain.enums.VerificationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VerificationRepository extends JpaRepository<Verification, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Verification v WHERE v.id = :id")
    Optional<Verification> findByIdForUpdate(@Param("id") String id);

    List<Verification> findByStatusOrderBySubmittedAtDesc(VerificationStatus status);
    List<Verification> findAllByOrderBySubmittedAtDesc();
    long countByStatus(VerificationStatus status);
}
