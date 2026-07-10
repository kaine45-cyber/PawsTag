package vn.pawstag.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.request.ForgotPasswordRequest;
import vn.pawstag.dto.request.LoginRequest;
import vn.pawstag.dto.request.RegisterRequest;
import vn.pawstag.dto.request.ResetPasswordRequest;
import vn.pawstag.dto.response.AuthResponse;
import vn.pawstag.dto.response.OwnerResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.enums.AuthProvider;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.exception.TooManyAttemptsException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.security.JwtService;
import vn.pawstag.security.LoginAttemptService;
import vn.pawstag.security.PasswordResetService;
import vn.pawstag.service.AuthService;
import vn.pawstag.service.EmailService;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final OwnerRepository ownerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;
    private final int otpExpiryMinutes;

    public AuthServiceImpl(OwnerRepository ownerRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           LoginAttemptService loginAttemptService,
                           PasswordResetService passwordResetService,
                           EmailService emailService,
                           @Value("${app.otp.expiry-minutes:10}") int otpExpiryMinutes) {
        this.ownerRepository = ownerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttemptService = loginAttemptService;
        this.passwordResetService = passwordResetService;
        this.emailService = emailService;
        this.otpExpiryMinutes = otpExpiryMinutes;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
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
        return new AuthResponse(token, OwnerResponse.from(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
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
        return new AuthResponse(token, OwnerResponse.from(owner));
    }

    @Override
    @Transactional(readOnly = true)
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        Owner owner = ownerRepository.findByEmail(email).orElse(null);
        // Không tiết lộ email có tồn tại hay không — luôn "thành công" ở phía controller.
        if (owner == null) return;
        String otp = passwordResetService.generate(email);
        try {
            emailService.sendPasswordResetOtp(email, otp, otpExpiryMinutes);
        } catch (Exception e) {
            log.error("Could not send password reset email to {}", email, e);
            // Không throw ra ngoài — tránh lộ thông tin qua thông báo lỗi khác nhau.
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        if (!passwordResetService.verify(email, request.otp().trim())) {
            throw new BadRequestException("Invalid or expired code");
        }
        Owner owner = ownerRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired code"));
        owner.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        ownerRepository.save(owner);
    }
}
