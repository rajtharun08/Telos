package app.telos.repo;

import app.telos.domain.entity.LedgerEntry;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT entry FROM LedgerEntry entry WHERE entry.id = :id")
    Optional<LedgerEntry> findByIdForUpdate(@Param("id") String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT entry FROM LedgerEntry entry WHERE entry.txId = :txId AND entry.type = :type")
    Optional<LedgerEntry> findByTxIdAndTypeForUpdate(
            @Param("txId") String txId,
            @Param("type") app.telos.domain.enums.LedgerType type);

    List<LedgerEntry> findByUserIdOrderByAtDesc(String userId);
}
