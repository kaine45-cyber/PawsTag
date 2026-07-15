package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.PasswordResetOtp;

import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    /** OTP mới nhất của một email (mã đang hiệu lực nếu có). */
    Optional<PasswordResetOtp> findTopByEmailOrderByCreatedAtDesc(String email);

    /** Xoá toàn bộ OTP cũ của email — dùng để vô hiệu mã cũ khi phát hành mã mới. */
    void deleteByEmail(String email);
}
