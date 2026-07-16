package vn.pawstag.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import vn.pawstag.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final boolean configured;

    public EmailServiceImpl(JavaMailSender mailSender,
                            @Value("${app.mail.from}") String from,
                            @Value("${spring.mail.username:}") String username,
                            @Value("${spring.mail.password:}") String password) {
        this.mailSender = mailSender;
        this.from = from;
        this.configured = !username.isBlank() && !password.isBlank() && !from.isBlank();
    }

    @Override
    @Async
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
        send(message, "password reset OTP");
    }

    @Override
    @Async
    public void sendPasswordChangedNotice(String toEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(toEmail);
        message.setSubject("Mật khẩu PawsTag đã được thay đổi");
        message.setText(
                "Xin chào,\n\n" +
                "Mật khẩu tài khoản PawsTag của bạn vừa được thay đổi thành công.\n\n" +
                "Nếu bạn không thực hiện thay đổi này, hãy liên hệ bộ phận hỗ trợ ngay.\n\n" +
                "— Đội ngũ PawsTag 🐾"
        );
        send(message, "password changed notice");
    }

    private void send(SimpleMailMessage message, String kind) {
        if (!configured) {
            log.error("Cannot send {}: configure MAIL_USERNAME, MAIL_PASSWORD and MAIL_FROM", kind);
            return;
        }
        try {
            mailSender.send(message);
        } catch (Exception e) {
            // Không log người nhận, OTP hoặc thông tin xác thực SMTP.
            log.error("Could not send {} ({})", kind, e.getClass().getSimpleName());
        }
    }
}
