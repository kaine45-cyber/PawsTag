package vn.pawstag.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.request.FacebookLoginRequest;
import vn.pawstag.dto.request.ForgotPasswordRequest;
import vn.pawstag.dto.request.GoogleLoginRequest;
import vn.pawstag.dto.request.LoginRequest;
import vn.pawstag.dto.request.RegisterRequest;
import vn.pawstag.dto.request.ResetPasswordRequest;
import vn.pawstag.dto.response.AuthSession;
import vn.pawstag.dto.response.OwnerResponse;
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
import vn.pawstag.service.AuthService;
import vn.pawstag.service.EmailService;

import java.util.Optional;
import java.util.function.Supplier;
import java.util.function.UnaryOperator;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final OwnerRepository ownerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final FacebookTokenVerifier facebookTokenVerifier;
    private final int otpExpiryMinutes;

    public AuthServiceImpl(OwnerRepository ownerRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           LoginAttemptService loginAttemptService,
                           PasswordResetService passwordResetService,
                           EmailService emailService,
                           GoogleTokenVerifier googleTokenVerifier,
                           FacebookTokenVerifier facebookTokenVerifier,
                           @Value("${app.otp.expiry-minutes:10}") int otpExpiryMinutes) {
        this.ownerRepository = ownerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttemptService = loginAttemptService;
        this.passwordResetService = passwordResetService;
        this.emailService = emailService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.facebookTokenVerifier = facebookTokenVerifier;
        this.otpExpiryMinutes = otpExpiryMinutes;
    }

    @Override
    @Transactional
    public AuthSession register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (ownerRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }

        Owner owner = Owner.builder()
                .email(email)
                .fullName(request.name().trim())
                .phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password()))
                .authProvider(AuthProvider.LOCAL)
                .role("USER")
                .build();

        Owner saved = ownerRepository.save(owner);
        String token = jwtService.generateToken(saved);
        return new AuthSession(token, OwnerResponse.from(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthSession login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        // Đang bị khóa do sai quá nhiều lần?
        long lockedSecs = loginAttemptService.lockedSecondsRemaining(email);
        if (lockedSecs > 0) {
            long mins = (lockedSecs + 59) / 60;   // làm tròn lên phút
            throw new TooManyAttemptsException(
                    "Too many failed attempts. Account locked — try again in " + mins + " minute" + (mins > 1 ? "s" : "") + ".");
        }

        Owner owner = ownerRepository.findByEmail(email).orElse(null);
        boolean ok = owner != null && owner.getPasswordHash() != null
                && passwordEncoder.matches(request.password(), owner.getPasswordHash());

        if (!ok) {
            loginAttemptService.loginFailed(email);
            throw new BadRequestException("Invalid email or password");
        }

        loginAttemptService.loginSucceeded(email);
        String token = jwtService.generateToken(owner);
        return new AuthSession(token, OwnerResponse.from(owner));
    }

    @Override
    public AuthSession googleLogin(GoogleLoginRequest request) {
        // 1) Verify credential VỚI GOOGLE (chữ ký + aud + iss + exp) — không tin frontend decode.
        GoogleTokenVerifier.Account acc = googleTokenVerifier.verify(request.credential());
        if (acc.email() == null || !acc.emailVerified()) {
            throw new BadRequestException("Google account email is not verified");
        }
        String email = acc.email().trim().toLowerCase();

        // 2) Định danh chính = Google sub (google_id); fallback link theo email đã verified.
        Owner owner = findOrCreateSocialOwner(
                () -> ownerRepository.findByGoogleId(acc.sub()),
                email,
                existing -> {
                    existing.setGoogleId(acc.sub());
                    if (existing.getAvatarUrl() == null) existing.setAvatarUrl(acc.picture());
                    if (existing.getFullName() == null) existing.setFullName(acc.name());
                    // KHÔNG đụng passwordHash hiện có.
                    return existing;
                },
                () -> Owner.builder()
                        .email(email)
                        .fullName(acc.name())
                        .avatarUrl(acc.picture())
                        .googleId(acc.sub())
                        .authProvider(AuthProvider.GOOGLE)
                        .passwordHash(null)
                        .role("USER")
                        .build());

        // 3) Tạo session PawsTag (cookie HttpOnly set ở controller, không trả token trong JSON).
        String token = jwtService.generateToken(owner);
        return new AuthSession(token, OwnerResponse.from(owner));
    }

    @Override
    public AuthSession facebookLogin(FacebookLoginRequest request) {
        // 1) Verify access token VỚI GRAPH API (debug_token + appsecret_proof) — không tin frontend.
        FacebookTokenVerifier.Account acc = facebookTokenVerifier.verify(request.accessToken());
        // Facebook có thể KHÔNG trả email (đăng ký bằng SĐT / từ chối quyền) → chấp nhận email null.
        // Email FB trả về đã được Facebook verify nên link theo email là an toàn.
        String email = (acc.email() == null || acc.email().isBlank())
                ? null
                : acc.email().trim().toLowerCase();

        // 2) Định danh chính = Facebook user id (facebook_id); fallback link theo email nếu có.
        Owner owner = findOrCreateSocialOwner(
                () -> ownerRepository.findByFacebookId(acc.id()),
                email,
                existing -> {
                    existing.setFacebookId(acc.id());
                    if (existing.getAvatarUrl() == null) existing.setAvatarUrl(acc.picture());
                    if (existing.getFullName() == null) existing.setFullName(acc.name());
                    // KHÔNG đụng passwordHash hiện có.
                    return existing;
                },
                () -> Owner.builder()
                        .email(email) // có thể null — user không email không dùng được forgot-password
                        .fullName(acc.name())
                        .avatarUrl(acc.picture())
                        .facebookId(acc.id())
                        .authProvider(AuthProvider.FACEBOOK)
                        .passwordHash(null)
                        .role("USER")
                        .build());

        // 3) Tạo session PawsTag (cookie HttpOnly set ở controller).
        String token = jwtService.generateToken(owner);
        return new AuthSession(token, OwnerResponse.from(owner));
    }

    /**
     * Tìm-hoặc-tạo owner cho social login (Google/Facebook), chống race khi 2 request
     * đầu tiên của cùng tài khoản chạy song song: bên thua unique constraint
     * (google_id/facebook_id/email) sẽ đọc lại bản ghi bên kia vừa tạo thay vì trả 500.
     *
     * CHỦ Ý không có @Transactional bao ngoài: mỗi thao tác repository tự có transaction
     * riêng, nhờ vậy DataIntegrityViolationException nổi lên ngay tại save (không phải
     * lúc commit) và lần đọc lại sau đó không dính transaction rollback-only.
     *
     * @param byProviderId lookup theo định danh provider (google_id/facebook_id)
     * @param email        email đã verify từ provider — null nếu provider không trả (Facebook)
     * @param linkExisting gắn định danh provider vào owner sẵn có tìm thấy theo email
     * @param createNew    dựng owner mới khi chưa có ai khớp
     */
    private Owner findOrCreateSocialOwner(Supplier<Optional<Owner>> byProviderId,
                                          String email,
                                          UnaryOperator<Owner> linkExisting,
                                          Supplier<Owner> createNew) {
        Owner owner = byProviderId.get().orElse(null);
        if (owner != null) return owner;

        try {
            Owner byEmail = (email != null) ? ownerRepository.findByEmail(email).orElse(null) : null;
            return ownerRepository.save(byEmail != null ? linkExisting.apply(byEmail) : createNew.get());
        } catch (DataIntegrityViolationException e) {
            // Request song song đã tạo/link trước → dùng bản ghi đã có.
            return byProviderId.get()
                    .or(() -> email != null ? ownerRepository.findByEmail(email) : Optional.empty())
                    .orElseThrow(() -> e);
        }
    }

    @Override
    @Transactional
    public int forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        int cooldownSeconds = passwordResetService.resendCooldownSeconds();
        Owner owner = ownerRepository.findByEmail(email).orElse(null);
        // Không tiết lộ email có tồn tại hay không — controller luôn trả response chung chung.
        if (owner == null) return cooldownSeconds;

        PasswordResetService.IssueResult issue = passwordResetService.issue(email);
        if (!issue.issued()) {
            throw new OtpCooldownException(issue.retryAfterSeconds());
        }

        try {
            emailService.sendPasswordResetOtp(email, issue.otp(), otpExpiryMinutes);
        } catch (Exception e) {
            log.error("Could not send password reset email to {}", email, e);
            throw new EmailDeliveryException("Could not send reset code. Please try again later.", e);
        }
        return cooldownSeconds;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        PasswordResetService.OtpResult result = passwordResetService.verify(email, request.otp().trim());
        if (result == PasswordResetService.OtpResult.TOO_MANY_ATTEMPTS) {
            throw new TooManyAttemptsException("Too many incorrect attempts. Please request a new code.");
        }
        if (result != PasswordResetService.OtpResult.OK) {
            throw new BadRequestException("Invalid or expired code");
        }
        // OTP hợp lệ → đặt mật khẩu local mới. Kể cả tài khoản Google/Facebook chưa có
        // passwordHash cũng được đặt mật khẩu (chủ email đã xác thực qua OTP).
        Owner owner = ownerRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired code"));
        owner.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        ownerRepository.save(owner);
    }
}
