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
import vn.pawstag.exception.EmailDeliveryException;
import vn.pawstag.exception.OtpCooldownException;
import vn.pawstag.exception.TooManyAttemptsException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.security.FacebookTokenVerifier;
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
    @Mock FacebookTokenVerifier facebookTokenVerifier;

    AuthServiceImpl service;

    private static final String EMAIL = "user@pawstag.vn";
    private static final int COOLDOWN_SECONDS = 60;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(ownerRepository, passwordEncoder, jwtService,
                loginAttemptService, passwordResetService, emailService, googleTokenVerifier, facebookTokenVerifier, 10);
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
    void forgotPassword_unknownEmail_returnsOkWithoutRevealing() {
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        int cooldown = service.forgotPassword(new ForgotPasswordRequest(EMAIL));

        assertThat(cooldown).isEqualTo(COOLDOWN_SECONDS);
        verify(passwordResetService, never()).issue(anyString());
        verifyNoInteractions(emailService);
    }

    @Test
    void forgotPassword_withinCooldown_throwsRetryAfterAndDoesNotSendEmail() {
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(localOwner()));
        when(passwordResetService.issue(EMAIL)).thenReturn(PasswordResetService.IssueResult.cooldown(42));

        assertThatThrownBy(() -> service.forgotPassword(new ForgotPasswordRequest(EMAIL)))
                .isInstanceOf(OtpCooldownException.class)
                .hasMessageContaining("42");

        verifyNoInteractions(emailService);
    }

    @Test
    void forgotPassword_whenEmailDeliveryFails_throwsServiceError() {
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(localOwner()));
        when(passwordResetService.issue(EMAIL)).thenReturn(PasswordResetService.IssueResult.issued("123456"));
        doThrow(new RuntimeException("smtp down"))
                .when(emailService).sendPasswordResetOtp(eq(EMAIL), eq("123456"), anyInt());

        assertThatThrownBy(() -> service.forgotPassword(new ForgotPasswordRequest(EMAIL)))
                .isInstanceOf(EmailDeliveryException.class)
                .hasMessageContaining("Could not send reset code");
    }

    @Test
    void resetPassword_validOtp_setsNewPassword() {
        Owner owner = localOwner();
        when(passwordResetService.verify(EMAIL, "123456")).thenReturn(OtpResult.OK);
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(passwordEncoder.encode("newpass123")).thenReturn("new-hash");

        service.resetPassword(new ResetPasswordRequest(EMAIL, "123456", "newpass123"));

        assertThat(owner.getPasswordHash()).isEqualTo("new-hash");
        verify(ownerRepository).save(owner);
    }

    @Test
    void resetPassword_googleAccountWithoutPassword_canSetLocalPassword() {
        Owner google = new Owner();
        google.setId(2L);
        google.setEmail(EMAIL);
        google.setPasswordHash(null);
        google.setAuthProvider(AuthProvider.GOOGLE);
        when(passwordResetService.verify(EMAIL, "123456")).thenReturn(OtpResult.OK);
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(google));
        when(passwordEncoder.encode("newpass123")).thenReturn("new-hash");

        service.resetPassword(new ResetPasswordRequest(EMAIL, "123456", "newpass123"));

        assertThat(google.getPasswordHash()).isEqualTo("new-hash");
        verify(ownerRepository).save(google);
    }

    @Test
    void resetPassword_invalidOtp_throwsBadRequest() {
        when(passwordResetService.verify(EMAIL, "000000")).thenReturn(OtpResult.INVALID);

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(EMAIL, "000000", "newpass123")))
                .isInstanceOf(BadRequestException.class);

        verify(ownerRepository, never()).save(any());
    }

    @Test
    void resetPassword_tooManyAttempts_throwsTooMany() {
        when(passwordResetService.verify(EMAIL, "000000")).thenReturn(OtpResult.TOO_MANY_ATTEMPTS);

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest(EMAIL, "000000", "newpass123")))
                .isInstanceOf(TooManyAttemptsException.class);

        verify(ownerRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());
    }
}
