package app.telos.repo;

import app.telos.domain.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    Optional<Wallet> findByIdForUpdate(@Param("userId") String userId);

    /** Locks multiple wallets in stable ID order to avoid cross-transaction deadlocks. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId IN :userIds ORDER BY w.userId")
    List<Wallet> findAllByUserIdInForUpdate(@Param("userIds") Collection<String> userIds);
}
