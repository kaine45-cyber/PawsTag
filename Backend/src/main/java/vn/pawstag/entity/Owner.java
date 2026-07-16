package vn.pawstag.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.pawstag.enums.AuthProvider;

import java.time.Instant;

@Entity
@Table(name = "owners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Owner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "owner_id")
    private Long id;

    /** Nullable: tài khoản Facebook có thể không có email (V14). Unique cho giá trị non-null. */
    @Column(unique = true)
    private String email;

    private String phone;

    @Column(name = "password_hash")
    private String passwordHash;

    /**
     * Tăng sau các thay đổi thông tin xác thực nhạy cảm (ví dụ reset mật khẩu).
     * JWT mang phiên bản này; token cũ lập tức mất hiệu lực khi giá trị thay đổi.
     */
    @Builder.Default
    @Column(name = "auth_version", nullable = false)
    private int authVersion = 0;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private String city;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false)
    private AuthProvider authProvider;

    @Column(name = "google_id")
    private String googleId;

    @Column(name = "facebook_id")
    private String facebookId;

    @Column(nullable = false)
    private String role;

    @Builder.Default
    @Column(name = "notif_scans", nullable = false)
    private boolean notifScans = true;

    @Builder.Default
    @Column(name = "notif_lost", nullable = false)
    private boolean notifLost = true;

    @Builder.Default
    @Column(name = "notif_updates", nullable = false)
    private boolean notifUpdates = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (authProvider == null) authProvider = AuthProvider.LOCAL;
        if (role == null) role = "USER";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
