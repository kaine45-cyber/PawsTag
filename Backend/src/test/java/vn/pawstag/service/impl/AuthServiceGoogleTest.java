package vn.pawstag.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.pawstag.dto.request.GoogleLoginRequest;
import vn.pawstag.dto.response.AuthSession;
import vn.pawstag.entity.Owner;
import vn.pawstag.enums.AuthProvider;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.security.FacebookTokenVerifier;
import vn.pawstag.security.GoogleNonceService;
import vn.pawstag.security.GoogleTokenVerifier;
import vn.pawstag.security.GoogleTokenVerifier.Account;
import vn.pawstag.security.JwtService;
import vn.pawstag.security.LoginAttemptService;
import vn.pawstag.security.PasswordResetService;
import vn.pawstag.service.EmailService;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test luồng Google login/register ở AuthServiceImpl (verifier được mock —
 * không gọi Google thật). Không đụng login/register/OTP/cookie.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceGoogleTest {

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

    private static final String SUB = "google-sub-123";
    private static final String EMAIL = "guser@pawstag.vn";
    private static final String NONCE = "nonce-abc";
    private static final GoogleLoginRequest REQ = new GoogleLoginRequest("id-token");

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(ownerRepository, passwordEncoder, jwtService,
                loginAttemptService, passwordResetService, emailService,
                googleTokenVerifier, googleNonceService, facebookTokenVerifier, 10);
        // Chỉ các test thành công mới gọi generateToken → lenient để 2 test reject không bị strict-stubbing.
        lenient().when(jwtService.generateToken(any(Owner.class))).thenReturn("jwt");
        lenient().when(googleNonceService.consume(NONCE)).thenReturn(true);
    }

    private Account verified() {
        return new Account(SUB, EMAIL, true, "Google User", "https://pic/avatar.png", NONCE);
    }

    @Test
    void googleLogin_validToken_newUser_createsGoogleOwner() {
        when(googleTokenVerifier.verify("id-token")).thenReturn(verified());
        when(ownerRepository.findByGoogleId(SUB)).thenReturn(Optional.empty());
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(ownerRepository.save(any(Owner.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthSession session = service.googleLogin(REQ);

        assertThat(session.owner()).isNotNull();
        ArgumentCaptor<Owner> saved = ArgumentCaptor.forClass(Owner.class);
        verify(ownerRepository).save(saved.capture());
        Owner o = saved.getValue();
        assertThat(o.getEmail()).isEqualTo(EMAIL);
        assertThat(o.getGoogleId()).isEqualTo(SUB);
        assertThat(o.getAuthProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(o.getPasswordHash()).isNull();
        assertThat(o.getRole()).isEqualTo("USER");
        assertThat(o.getFullName()).isEqualTo("Google User");
        assertThat(o.getAvatarUrl()).isEqualTo("https://pic/avatar.png");
    }

    @Test
    void googleLogin_validToken_existingGoogleId_logsInWithoutCreating() {
        Owner existing = Owner.builder().id(7L).email(EMAIL).googleId(SUB)
                .authProvider(AuthProvider.GOOGLE).role("USER").build();
        when(googleTokenVerifier.verify("id-token")).thenReturn(verified());
        when(ownerRepository.findByGoogleId(SUB)).thenReturn(Optional.of(existing));

        AuthSession session = service.googleLogin(REQ);

        assertThat(session.owner()).isNotNull();
        verify(ownerRepository, never()).save(any());          // login sẵn có, không tạo/sửa
        verify(ownerRepository, never()).findByEmail(any());
    }

    @Test
    void googleLogin_validToken_existingEmail_linksGoogleIdAndFillsBlanks() {
        Owner local = Owner.builder().id(9L).email(EMAIL)
                .passwordHash("keep-this-hash").authProvider(AuthProvider.LOCAL)
                .role("USER").fullName(null).avatarUrl(null).build();
        when(googleTokenVerifier.verify("id-token")).thenReturn(verified());
        when(ownerRepository.findByGoogleId(SUB)).thenReturn(Optional.empty());
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(local));
        when(ownerRepository.save(any(Owner.class))).thenAnswer(inv -> inv.getArgument(0));

        service.googleLogin(REQ);

        assertThat(local.getGoogleId()).isEqualTo(SUB);          // linked
        assertThat(local.getFullName()).isEqualTo("Google User"); // filled from Google
        assertThat(local.getAvatarUrl()).isEqualTo("https://pic/avatar.png");
        assertThat(local.getPasswordHash()).isEqualTo("keep-this-hash"); // NOT overwritten
        verify(ownerRepository).save(local);
    }

    @Test
    void googleLogin_invalidToken_isRejected() {
        when(googleTokenVerifier.verify("id-token")).thenThrow(new BadRequestException("Invalid Google token"));

        assertThatThrownBy(() -> service.googleLogin(REQ)).isInstanceOf(BadRequestException.class);

        verify(ownerRepository, never()).save(any());
    }

    @Test
    void googleLogin_emailNotVerified_isRejected() {
        when(googleTokenVerifier.verify("id-token"))
                .thenReturn(new Account(SUB, EMAIL, false, "Google User", "https://pic/avatar.png", NONCE));

        assertThatThrownBy(() -> service.googleLogin(REQ)).isInstanceOf(BadRequestException.class);

        verify(ownerRepository, never()).save(any());
        verify(ownerRepository, never()).findByGoogleId(any());
        // Email chưa verify bị chặn TRƯỚC khi consume → không đốt mất nonce của user.
        verify(googleNonceService, never()).consume(any());
    }

    @Test
    void googleLogin_replayedOrMissingNonce_isRejected() {
        when(googleTokenVerifier.verify("id-token")).thenReturn(verified());
        when(googleNonceService.consume(NONCE)).thenReturn(false); // đã dùng / không do backend phát

        assertThatThrownBy(() -> service.googleLogin(REQ)).isInstanceOf(BadRequestException.class);

        verify(ownerRepository, never()).save(any());
        verify(ownerRepository, never()).findByGoogleId(any());
    }
}
