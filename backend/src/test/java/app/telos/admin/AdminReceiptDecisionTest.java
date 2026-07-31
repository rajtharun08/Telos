package app.telos.admin;

import app.telos.admin.dto.DecideVerificationResponse;
import app.telos.common.BusinessException;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.Verification;
import app.telos.domain.entity.Wallet;
import app.telos.domain.enums.LedgerStatus;
import app.telos.domain.enums.LedgerType;
import app.telos.domain.enums.VerificationKind;
import app.telos.domain.enums.VerificationStatus;
import app.telos.repo.LedgerEntryRepository;
import app.telos.repo.TransactionRepository;
import app.telos.repo.UserRepository;
import app.telos.repo.VerificationRepository;
import app.telos.repo.WalletRepository;
import app.telos.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminReceiptDecisionTest {

    @Mock private VerificationRepository verifications;
    @Mock private LedgerEntryRepository ledger;
    @Mock private WalletRepository wallets;
    @Mock private TransactionRepository transactions;
    @Mock private UserRepository users;
    @Mock private CurrentUser currentUser;

    private AdminService service;

    @BeforeEach
    void setUp() {
        service = new AdminService(
                verifications, ledger, wallets, transactions, users, currentUser);
        when(currentUser.isAdmin()).thenReturn(true);
        when(currentUser.id()).thenReturn("admin");
        app.telos.domain.entity.User admin = new app.telos.domain.entity.User();
        admin.setId("admin");
        admin.setAdmin(true);
        when(users.findById("admin")).thenReturn(Optional.of(admin));
    }

    @Test
    void approvalRequiresLinkedPendingTopup() {
        Verification verification = receipt(null);
        when(verifications.findByIdForUpdate("vq-1")).thenReturn(Optional.of(verification));

        BusinessException error = catchThrowableOfType(
                () -> service.decide("vq-1", "APPROVED"), BusinessException.class);

        assertThat(error.getCode()).isEqualTo("INVALID_RECEIPT");
        assertThat(error.getStatus()).isEqualTo(409);
        verifyNoInteractions(ledger, wallets);
    }

    @Test
    void approvalClearsExactlyTheLinkedTopup() {
        Verification verification = receipt("ledger-1");
        LedgerEntry entry = topup();
        Wallet wallet = wallet();
        when(verifications.findByIdForUpdate("vq-1")).thenReturn(Optional.of(verification));
        when(ledger.findByIdForUpdate("ledger-1")).thenReturn(Optional.of(entry));
        when(wallets.findByIdForUpdate("user-1")).thenReturn(Optional.of(wallet));

        DecideVerificationResponse response = service.decide("vq-1", "APPROVED");

        assertThat(response.status()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(response.clearedAmount()).isEqualTo(90.0);
        assertThat(entry.getStatus()).isEqualTo(LedgerStatus.CLEARED);
        assertThat(wallet.getPendingClear()).isZero();
        assertThat(wallet.getAvailable()).isEqualTo(100.0);
        verify(verifications).findByIdForUpdate("vq-1");
        verify(ledger).save(entry);
        verify(wallets).save(wallet);
    }

    @Test
    void rejectionRemovesPendingFundsWithoutCreditingAvailable() {
        Verification verification = receipt("ledger-1");
        LedgerEntry entry = topup();
        Wallet wallet = wallet();
        when(verifications.findByIdForUpdate("vq-1")).thenReturn(Optional.of(verification));
        when(ledger.findByIdForUpdate("ledger-1")).thenReturn(Optional.of(entry));
        when(wallets.findByIdForUpdate("user-1")).thenReturn(Optional.of(wallet));

        DecideVerificationResponse response = service.decide("vq-1", "REJECTED");

        assertThat(response.status()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(response.clearedAmount()).isNull();
        assertThat(entry.getStatus()).isEqualTo(LedgerStatus.REJECTED);
        assertThat(wallet.getPendingClear()).isZero();
        assertThat(wallet.getAvailable()).isEqualTo(10.0);
    }

    private static Verification receipt(String ledgerId) {
        Verification verification = new Verification();
        verification.setId("vq-1");
        verification.setKind(VerificationKind.RECEIPT);
        verification.setUserId("user-1");
        verification.setAmount(90.0);
        verification.setStatus(VerificationStatus.PENDING);
        verification.setLedgerId(ledgerId);
        return verification;
    }

    private static LedgerEntry topup() {
        LedgerEntry entry = new LedgerEntry();
        entry.setId("ledger-1");
        entry.setUserId("user-1");
        entry.setType(LedgerType.TOPUP);
        entry.setAmount(90.0);
        entry.setStatus(LedgerStatus.PENDING);
        return entry;
    }

    private static Wallet wallet() {
        Wallet wallet = new Wallet();
        wallet.setUserId("user-1");
        wallet.setAvailable(10.0);
        wallet.setPendingClear(90.0);
        return wallet;
    }
}
