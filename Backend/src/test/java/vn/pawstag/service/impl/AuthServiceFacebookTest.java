package vn.pawstag.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.pawstag.dto.request.FacebookLoginRequest;
import vn.pawstag.dto.response.AuthSession;
import vn.pawstag.entity.Owner;
import vn.pawstag.enums.AuthProvider;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.security.FacebookTokenVerifier;
import vn.pawstag.security.GoogleNonceService;
import vn.pawstag.security.GoogleTokenVerifier;
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
 * Unit test luồng Facebook login/register ở AuthServiceImpl (verifier được mock —
 * không gọi Graph API thật). Điểm khác Google: email CÓ THỂ null.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceFacebookTest {

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

    private static final String FB_ID = "fb-user-123";
    private static final String EMAIL = "fbuser@pawstag.vn";
    private static final FacebookLoginRequest REQ = new FacebookLoginRequest("fb-access-token");

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(ownerRepository, passwordEncoder, jwtService,
                loginAttemptService, passwordResetService, emailService,
                googleTokenVerifier, googleNonceService, facebookTokenVerifier, 10);
        lenient().when(jwtService.generateToken(any(Owner.class))).thenReturn("jwt");
    }

    private FacebookTokenVerifier.Account account(String email) {
        return new FacebookTokenVerifier.Account(FB_ID, email, "FB User", "https://pic/fb.png");
    }

    @Test
    void facebookLogin_newUserWithEmail_createsFacebookOwner() {
        when(facebookTokenVerifier.verify("fb-access-token")).thenReturn(account(EMAIL));
        when(ownerRepository.findByFacebookId(FB_ID)).thenReturn(Optional.empty());
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(ownerRepository.save(any(Owner.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthSession session = service.facebookLogin(REQ);

        assertThat(session.owner()).isNotNull();
        ArgumentCaptor<Owner> saved = ArgumentCaptor.forClass(Owner.class);
        verify(ownerRepository).save(saved.capture());
        Owner o = saved.getValue();
        assertThat(o.getEmail()).isEqualTo(EMAIL);
        assertThat(o.getFacebookId()).isEqualTo(FB_ID);
        assertThat(o.getAuthProvider()).isEqualTo(AuthProvider.FACEBOOK);
        assertThat(o.getPasswordHash()).isNull();
        assertThat(o.getRole()).isEqualTo("USER");
    }

    @Test
    void facebookLogin_withoutEmail_stillCreatesOwner() {
        // Case đặc thù Facebook: user đăng ký bằng SĐT / từ chối quyền email.
        when(facebookTokenVerifier.verify("fb-access-token")).thenReturn(account(null));
        when(ownerRepository.findByFacebookId(FB_ID)).thenReturn(Optional.empty());
        when(ownerRepository.save(any(Owner.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthSession session = service.facebookLogin(REQ);

        assertThat(session.owner()).isNotNull();
        ArgumentCaptor<Owner> saved = ArgumentCaptor.forClass(Owner.class);
        verify(ownerRepository).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isNull();       // không email vẫn tạo được (V14)
        assertThat(saved.getValue().getFacebookId()).isEqualTo(FB_ID);
        verify(ownerRepository, never()).findByEmail(any());    // không tra email khi null
    }

    @Test
    void facebookLogin_existingFacebookId_logsInWithoutCreating() {
        Owner existing = Owner.builder().id(7L).email(EMAIL).facebookId(FB_ID)
                .authProvider(AuthProvider.FACEBOOK).role("USER").build();
        when(facebookTokenVerifier.verify("fb-access-token")).thenReturn(account(EMAIL));
        when(ownerRepository.findByFacebookId(FB_ID)).thenReturn(Optional.of(existing));

        AuthSession session = service.facebookLogin(REQ);

        assertThat(session.owner()).isNotNull();
        verify(ownerRepository, never()).save(any());
        verify(ownerRepository, never()).findByEmail(any());
    }

    @Test
    void facebookLogin_existingEmail_linksFacebookIdAndKeepsPassword() {
        Owner local = Owner.builder().id(9L).email(EMAIL)
                .passwordHash("keep-this-hash").authProvider(AuthProvider.LOCAL)
                .role("USER").fullName(null).avatarUrl(null).build();
        when(facebookTokenVerifier.verify("fb-access-token")).thenReturn(account(EMAIL));
        when(ownerRepository.findByFacebookId(FB_ID)).thenReturn(Optional.empty());
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(local));
        when(ownerRepository.save(any(Owner.class))).thenAnswer(inv -> inv.getArgument(0));

        service.facebookLogin(REQ);

        assertThat(local.getFacebookId()).isEqualTo(FB_ID);              // linked
        assertThat(local.getFullName()).isEqualTo("FB User");            // filled from Facebook
        assertThat(local.getPasswordHash()).isEqualTo("keep-this-hash"); // NOT overwritten
        verify(ownerRepository).save(local);
    }

    @Test
    void facebookLogin_invalidToken_isRejected() {
        when(facebookTokenVerifier.verify("fb-access-token"))
                .thenThrow(new BadRequestException("Invalid Facebook token"));

        assertThatThrownBy(() -> service.facebookLogin(REQ)).isInstanceOf(BadRequestException.class);

        verify(ownerRepository, never()).save(any());
    }

    @Test
    void facebookLogin_raceOnCreate_recoversByRelookup() {
        // 2 request song song: bên này thua unique constraint → đọc lại bản bên kia vừa tạo.
        Owner winner = Owner.builder().id(5L).email(EMAIL).facebookId(FB_ID)
                .authProvider(AuthProvider.FACEBOOK).role("USER").build();
        when(facebookTokenVerifier.verify("fb-access-token")).thenReturn(account(EMAIL));
        when(ownerRepository.findByFacebookId(FB_ID))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(winner));
        when(ownerRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(ownerRepository.save(any(Owner.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        AuthSession session = service.facebookLogin(REQ);

        assertThat(session.owner()).isNotNull(); // không 500 — dùng bản ghi của request thắng
    }
}
