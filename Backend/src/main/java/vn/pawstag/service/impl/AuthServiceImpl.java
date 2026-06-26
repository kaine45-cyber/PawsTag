package vn.pawstag.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.dto.request.LoginRequest;
import vn.pawstag.dto.request.RegisterRequest;
import vn.pawstag.dto.response.AuthResponse;
import vn.pawstag.dto.response.OwnerResponse;
import vn.pawstag.entity.Owner;
import vn.pawstag.enums.AuthProvider;
import vn.pawstag.exception.BadRequestException;
import vn.pawstag.exception.TooManyAttemptsException;
import vn.pawstag.repository.OwnerRepository;
import vn.pawstag.security.JwtService;
import vn.pawstag.security.LoginAttemptService;
import vn.pawstag.service.AuthService;

@Service
public class AuthServiceImpl implements AuthService {

    private final OwnerRepository ownerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;

    public AuthServiceImpl(OwnerRepository ownerRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           LoginAttemptService loginAttemptService) {
        this.ownerRepository = ownerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttemptService = loginAttemptService;
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
}
