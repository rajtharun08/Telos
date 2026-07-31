package app.telos.repo;

import app.telos.domain.entity.Transaction;
import app.telos.domain.enums.TxState;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, String> {

    /** Serialize lifecycle transitions and escrow settlement for one transaction. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Transaction t WHERE t.id = :id")
    Optional<Transaction> findByIdForUpdate(@Param("id") String id);

    List<Transaction> findByBorrowerIdOrLenderId(String borrowerId, String lenderId);
    List<Transaction> findByStateAndDueAtBefore(TxState state, Instant cutoff);
    boolean existsByItemIdAndStateIn(String itemId, Collection<TxState> states);
    boolean existsByItemIdAndBorrowerIdAndStateIn(String itemId, String borrowerId, List<TxState> states);
}
