package vn.pawstag.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.pawstag.dto.request.ForgotPasswordRequest;
import vn.pawstag.dto.request.ResetPasswordRequest;
import vn.pawstag.entity.Owner;
import vn.pawstag.enums.AuthProvider;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.exception.TooManyAttemptsException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.security.FacebookTokenVerifier;
import vn.pawstag.security.GoogleNonceService;
import vn.pawstag.security.GoogleTokenVerifier;
import vn.pawstag.security.JwtService;
import vn.pawstag.security.LoginAttemptService;
import vn.pawstag.security.PasswordResetService;
import vn.pawstag.security.PasswordResetService.OtpResult;
import vn.pawstag.service.EmailService;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceOtpTest {

    @Mock OwnerRepository ownerRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock LoginAttemptService loginAttemptService;
    @Mock PasswordResetService passwordResetService;
    @Mock EmailService emailService;
    @Mock GoogleTokenVerifier googleTokenVerifier;
    @Mock GoogleNonceService googleNonceService;
    @Mock FacebookTokenVerifier facebookTokenVerifier;

    AuthServiceImpl service;

    private static final String EMAIL = "user@pawstag.vn";
    private static final int COOLDOWN_SECONDS = 60;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(ownerRepository, passwordEncoder, jwtService,
                loginAttemptService, passwordResetService, emailService,
                googleTokenVerifier, googleNonceService, facebookTokenVerifier, 10);
        lenient().when(passwordResetService.resendCooldownSeconds()).thenReturn(COOLDOWN_SECONDS);
    }

    private Owner localOwner() {
        Owner o = new Owner();
        o.setId(1L);
        o.setEmail(EMAIL);
        o.setPasswordHash("old-hash");
        o.setAuthProvider(AuthProvider.LOCAL);
        return o;
    }

    @Test
    void forgotPassword_existingEmail_issuesAndSendsOtp() {
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(localOwner()));
        when(passwordResetService.issue(EMAIL)).thenReturn(PasswordResetService.IssueResult.issued("123456"));

        int cooldown = service.forgotPassword(new ForgotPasswordRequest(EMAIL));

        assertThat(cooldown).isEqualTo(COOLDOWN_SECONDS);
        verify(emailService).sendPasswordResetOtp(eq(EMAIL), eq("123456"), anyInt());
    }

    @Test
    void forgotPassword_unknownEmail_returnsSameResponseAndPerformsDummyHash() {
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        int cooldown = service.forgotPassword(new ForgotPasswordRequest(EMAIL));

        assertThat(cooldown).isEqualTo(COOLDOWN_SECONDS);
        verify(passwordResetService, never()).issue(anyString());
        verify(passwordResetService).performDummyHash();
        verifyNoInteractions(emailService);
    }

    @Test
    void forgotPassword_withinCooldown_returnsSameResponseAndDoesNotSendEmail() {
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(localOwner()));
        when(passwordResetService.issue(EMAIL)).thenReturn(PasswordResetService.IssueResult.cooldown(42));

        int cooldown = service.forgotPassword(new ForgotPasswordRequest(EMAIL));

        assertThat(cooldown).isEqualTo(COOLDOWN_SECONDS);
        verify(passwordResetService).performDummyHash();
        verifyNoInteractions(emailService);
    }

    @Test
    void forgotPassword_whenEmailSchedulingFails_stillReturnsGenericResponse() {
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(localOwner()));
        when(passwordResetService.issue(EMAIL)).thenReturn(PasswordResetService.IssueResult.issued("123456"));
        doThrow(new RuntimeException("smtp down"))
                .when(emailService).sendPasswordResetOtp(eq(EMAIL), eq("123456"), anyInt());

        assertThat(service.forgotPassword(new ForgotPasswordRequest(EMAIL)))
                .isEqualTo(COOLDOWN_SECONDS);
    }

    @Test
    void resetPassword_validOtp_clearsLoginLockAndSendsSecurityNotice() {
        when(passwordResetService.resetPassword(EMAIL, "123456", "newpass123")).thenReturn(OtpResult.OK);

        service.resetPassword(new ResetPasswordRequest(EMAIL, "123456", "newpass123"));

        verify(loginAttemptService).loginSucceeded(EMAIL);
        verify(emailService).sendPasswordChangedNotice(EMAIL);
    }

    @Test
    void resetPassword_securityNoticeFailure_doesNotFailSuccessfulReset() {
        when(passwordResetService.resetPassword(EMAIL, "123456", "newpass123")).thenReturn(OtpResult.OK);
        doThrow(new RuntimeException("executor unavailable"))
                .when(emailService).sendPasswordChangedNotice(EMAIL);

        service.resetPassword(new ResetPasswordRequest(EMAIL, "123456", "newpass123"));

        verify(loginAttemptService).loginSucceeded(EMAIL);
    }

    @Test
    void resetPassword_invalidOtp_throwsBadRequest() {
        when(passwordResetService.resetPassword(EMAIL, "000000", "newpass123")).thenReturn(OtpResult.INVALID);

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(EMAIL, "000000", "newpass123")))
                .isInstanceOf(BadRequestException.class);

        verify(emailService, never()).sendPasswordChangedNotice(anyString());
    }

    @Test
    void resetPassword_tooManyAttempts_throwsTooMany() {
        when(passwordResetService.resetPassword(EMAIL, "000000", "newpass123"))
                .thenReturn(OtpResult.TOO_MANY_ATTEMPTS);

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(EMAIL, "000000", "newpass123")))
                .isInstanceOf(TooManyAttemptsException.class);

        verify(emailService, never()).sendPasswordChangedNotice(anyString());
    }

    @Test
    void resetPassword_overBcryptByteLimit_rejectedBeforeOtpIsConsumed() {
        String tooLong = "é".repeat(40); // 40 ký tự nhưng 80 byte UTF-8

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(EMAIL, "123456", tooLong)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("72 UTF-8 bytes");

        verify(passwordResetService, never()).resetPassword(anyString(), anyString(), anyString());
    }
}
