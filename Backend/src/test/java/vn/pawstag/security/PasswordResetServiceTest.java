package vn.pawstag.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.pawstag.entity.PasswordResetOtp;
import vn.pawstag.repository.PasswordResetOtpRepository;
import vn.pawstag.security.PasswordResetService.OtpResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock PasswordResetOtpRepository repository;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private PasswordResetService service;

    private static final String EMAIL = "user@pawstag.vn";
    private static final int EXPIRY_MIN = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final int COOLDOWN_SEC = 60;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(repository, encoder, EXPIRY_MIN, MAX_ATTEMPTS, COOLDOWN_SEC);
    }

    private PasswordResetOtp row(String plaintextOtp, Instant expiresAt, Instant lastSentAt, int attempts, Instant usedAt) {
        return PasswordResetOtp.builder()
                .id(1L).email(EMAIL)
                .otpHash(encoder.encode(plaintextOtp))
                .expiresAt(expiresAt)
                .attemptCount(attempts)
                .usedAt(usedAt)
                .createdAt(Instant.now())
                .lastSentAt(lastSentAt)
                .build();
    }

    @Test
    void issue_whenNoExisting_createsHashedOtp() {
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL)).thenReturn(Optional.empty());

        PasswordResetService.IssueResult issue = service.issue(EMAIL);

        assertThat(issue.issued()).isTrue();
        assertThat(issue.otp()).matches("\\d{6}");
        verify(repository).deleteByEmail(EMAIL);
        ArgumentCaptor<PasswordResetOtp> saved = ArgumentCaptor.forClass(PasswordResetOtp.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getOtpHash()).isNotEqualTo(issue.otp());
        assertThat(encoder.matches(issue.otp(), saved.getValue().getOtpHash())).isTrue();
    }

    @Test
    void issue_withinCooldown_returnsRetryAfterAndKeepsOldCode() {
        Instant now = Instant.now();
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.of(row("111111", now.plus(9, ChronoUnit.MINUTES), now, 0, null)));

        PasswordResetService.IssueResult issue = service.issue(EMAIL);

        assertThat(issue.issued()).isFalse();
        assertThat(issue.retryAfterSeconds()).isBetween(1, COOLDOWN_SEC);
        verify(repository, never()).deleteByEmail(any());
        verify(repository, never()).save(any());
    }

    @Test
    void issue_afterCooldown_invalidatesOldAndCreatesNew() {
        Instant old = Instant.now().minus(5, ChronoUnit.MINUTES);
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.of(row("111111", Instant.now().plus(4, ChronoUnit.MINUTES), old, 0, null)));

        PasswordResetService.IssueResult issue = service.issue(EMAIL);

        assertThat(issue.issued()).isTrue();
        verify(repository).deleteByEmail(EMAIL);
        verify(repository).save(any(PasswordResetOtp.class));
    }

    @Test
    void verify_correctOtp_returnsOk_andMarksUsed() {
        Instant now = Instant.now();
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.of(row("123456", now.plus(5, ChronoUnit.MINUTES), now, 0, null)));

        OtpResult result = service.verify(EMAIL, "123456");

        assertThat(result).isEqualTo(OtpResult.OK);
        ArgumentCaptor<PasswordResetOtp> saved = ArgumentCaptor.forClass(PasswordResetOtp.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getUsedAt()).isNotNull();
    }

    @Test
    void verify_wrongOtp_incrementsAttemptCount() {
        Instant now = Instant.now();
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.of(row("123456", now.plus(5, ChronoUnit.MINUTES), now, 0, null)));

        OtpResult result = service.verify(EMAIL, "000000");

        assertThat(result).isEqualTo(OtpResult.INVALID);
        ArgumentCaptor<PasswordResetOtp> saved = ArgumentCaptor.forClass(PasswordResetOtp.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getAttemptCount()).isEqualTo(1);
        verify(repository, never()).delete(any());
    }

    @Test
    void verify_wrongOtp_reachingMaxAttempts_invalidatesCode() {
        Instant now = Instant.now();
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.of(row("123456", now.plus(5, ChronoUnit.MINUTES), now, MAX_ATTEMPTS - 1, null)));

        OtpResult result = service.verify(EMAIL, "000000");

        assertThat(result).isEqualTo(OtpResult.TOO_MANY_ATTEMPTS);
        verify(repository).delete(any(PasswordResetOtp.class));
        verify(repository, never()).save(any());
    }

    @Test
    void verify_expiredOtp_returnsInvalid() {
        Instant now = Instant.now();
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.of(row("123456", now.minus(1, ChronoUnit.MINUTES), now, 0, null)));

        assertThat(service.verify(EMAIL, "123456")).isEqualTo(OtpResult.INVALID);
        verify(repository, never()).save(any());
    }

    @Test
    void verify_alreadyUsedOtp_cannotBeReused() {
        Instant now = Instant.now();
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL))
                .thenReturn(Optional.of(row("123456", now.plus(5, ChronoUnit.MINUTES), now, 0, now)));

        assertThat(service.verify(EMAIL, "123456")).isEqualTo(OtpResult.INVALID);
        verify(repository, never()).save(any());
    }

    @Test
    void verify_noOtp_returnsInvalid() {
        when(repository.findTopByEmailOrderByCreatedAtDesc(EMAIL)).thenReturn(Optional.empty());
        assertThat(service.verify(EMAIL, "123456")).isEqualTo(OtpResult.INVALID);
    }
}
