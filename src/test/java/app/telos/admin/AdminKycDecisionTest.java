package app.telos.admin;

import app.telos.admin.dto.DecideVerificationResponse;
import app.telos.common.BusinessException;
import app.telos.domain.entity.LedgerEntry;
import app.telos.domain.entity.User;
import app.telos.domain.entity.Verification;
import app.telos.domain.entity.Wallet;
import app.telos.domain.enums.KycStatus;
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
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.repository.Lock;

import java.lang.reflect.Method;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminKycDecisionTest {

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

        User admin = user("admin", false, KycStatus.PENDING);
        admin.setAdmin(true);
        lenient().when(currentUser.isAdmin()).thenReturn(true);
        lenient().when(currentUser.id()).thenReturn("admin");
        lenient().when(users.findById("admin")).thenReturn(Optional.of(admin));
    }

    @Test
    void approvalAtomicallyVerifiesTheLockedSubjectUser() {
        Verification verification = kyc(VerificationStatus.PENDING);
        User subject = user("user-1", false, KycStatus.REJECTED);
        when(verifications.findByIdForUpdate("vq-1")).thenReturn(Optional.of(verification));
        when(users.findByIdForUpdate("user-1")).thenReturn(Optional.of(subject));

        DecideVerificationResponse response = service.decide("vq-1", "APPROVED");

        assertThat(response.id()).isEqualTo("vq-1");
        assertThat(response.status()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(response.clearedAmount()).isNull();
        assertThat(verification.getStatus()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(subject.getKycStatus()).isEqualTo(KycStatus.VERIFIED);
        assertThat(subject.isVerified()).isTrue();
        verify(users).findByIdForUpdate("user-1");
        verify(users).save(subject);
        verify(verifications).save(verification);
    }

    @Test
    void rejectionAtomicallyRejectsAndUnverifiesTheLockedSubjectUser() {
        Verification verification = kyc(VerificationStatus.PENDING);
        User subject = user("user-1", true, KycStatus.VERIFIED);
        when(verifications.findByIdForUpdate("vq-1")).thenReturn(Optional.of(verification));
        when(users.findByIdForUpdate("user-1")).thenReturn(Optional.of(subject));

        DecideVerificationResponse response = service.decide("vq-1", "REJECTED");

        assertThat(response.status()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(response.clearedAmount()).isNull();
        assertThat(verification.getStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(subject.getKycStatus()).isEqualTo(KycStatus.REJECTED);
        assertThat(subject.isVerified()).isFalse();
        verify(users).findByIdForUpdate("user-1");
        verify(users).save(subject);
        verify(verifications).save(verification);
    }

    @Test
    void missingKycSubjectFailsClosedBeforeVerificationMutation() {
        Verification verification = kyc(VerificationStatus.PENDING);
        when(verifications.findByIdForUpdate("vq-1")).thenReturn(Optional.of(verification));
        when(users.findByIdForUpdate("user-1")).thenAnswer(invocation -> {
            assertThat(verification.getStatus()).isEqualTo(VerificationStatus.PENDING);
            return Optional.empty();
        });

        BusinessException error = catchThrowableOfType(
                () -> service.decide("vq-1", "APPROVED"), BusinessException.class);

        assertThat(error.getCode()).isEqualTo("INVALID_KYC");
        assertThat(error.getStatus()).isEqualTo(409);
        assertThat(verification.getStatus()).isEqualTo(VerificationStatus.PENDING);
        verify(users, never()).save(any(User.class));
        verify(verifications, never()).save(any(Verification.class));
    }

    @Test
    void alreadyDecidedKycDoesNotTouchSubjectUserState() {
        Verification verification = kyc(VerificationStatus.APPROVED);
        when(verifications.findByIdForUpdate("vq-1")).thenReturn(Optional.of(verification));

        BusinessException error = catchThrowableOfType(
                () -> service.decide("vq-1", "REJECTED"), BusinessException.class);

        assertThat(error.getCode()).isEqualTo("ALREADY_DECIDED");
        verify(users).findById("admin");
        verifyNoMoreInteractions(users);
    }

    @Test
    void receiptDecisionDoesNotTouchSubjectUserState() {
        Verification verification = receipt();
        LedgerEntry entry = pendingTopup();
        Wallet wallet = wallet();
        when(verifications.findByIdForUpdate("vq-1")).thenReturn(Optional.of(verification));
        when(ledger.findByIdForUpdate("ledger-1")).thenReturn(Optional.of(entry));
        when(wallets.findByIdForUpdate("user-1")).thenReturn(Optional.of(wallet));

        DecideVerificationResponse response = service.decide("vq-1", "APPROVED");

        assertThat(response.status()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(response.clearedAmount()).isEqualTo(90.0);
        verify(users).findById("admin");
        verifyNoMoreInteractions(users);
    }

    @Test
    void subjectLookupDeclaresPessimisticWriteLock() throws NoSuchMethodException {
        Method method = UserRepository.class.getMethod("findByIdForUpdate", String.class);

        Lock lock = method.getAnnotation(Lock.class);
        assertThat(lock).isNotNull();
        assertThat(lock.value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
    }

    private static Verification kyc(VerificationStatus status) {
        Verification verification = new Verification();
        verification.setId("vq-1");
        verification.setKind(VerificationKind.KYC);
        verification.setUserId("user-1");
        verification.setStatus(status);
        return verification;
    }

    private static Verification receipt() {
        Verification verification = new Verification();
        verification.setId("vq-1");
        verification.setKind(VerificationKind.RECEIPT);
        verification.setUserId("user-1");
        verification.setAmount(90.0);
        verification.setStatus(VerificationStatus.PENDING);
        verification.setLedgerId("ledger-1");
        return verification;
    }

    private static User user(String id, boolean verified, KycStatus kycStatus) {
        User user = new User();
        user.setId(id);
        user.setVerified(verified);
        user.setKycStatus(kycStatus);
        return user;
    }

    private static LedgerEntry pendingTopup() {
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
