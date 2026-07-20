package app.telos.repo;

import app.telos.domain.entity.HandoffToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface HandoffTokenRepository extends JpaRepository<HandoffToken, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM HandoffToken h WHERE h.tokenHash = :tokenHash")
    Optional<HandoffToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    long deleteByExpiresAtBefore(Instant cutoff);

    long deleteByTransactionIdAndMintedByAndConsumedAtIsNull(
            String transactionId, String mintedBy);
}
