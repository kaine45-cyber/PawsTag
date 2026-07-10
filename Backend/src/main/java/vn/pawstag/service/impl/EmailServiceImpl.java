package vn.pawstag.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import vn.pawstag.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final String from;

    public EmailServiceImpl(JavaMailSender mailSender, @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp, int expiryMinutes) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(toEmail);
        message.setSubject("Mã đặt lại mật khẩu PawsTag");
        message.setText(
                "Xin chào,\n\n" +
                "Mã OTP để đặt lại mật khẩu PawsTag của bạn là:\n\n" +
                "    " + otp + "\n\n" +
                "Mã có hiệu lực trong " + expiryMinutes + " phút. " +
                "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.\n\n" +
                "— Đội ngũ PawsTag 🐾"
        );
        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Gửi email OTP thất bại tới {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }
}
