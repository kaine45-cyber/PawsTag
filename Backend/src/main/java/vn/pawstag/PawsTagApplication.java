package vn.pawstag;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // job nhắc lịch tiêm (VaccinationReminderJob)
@EnableAsync        // reverse-geocode chạy nền, không chặn transaction lưu scan (ScanGeocodeUpdater)
public class PawsTagApplication {

    public static void main(String[] args) {
        SpringApplication.run(PawsTagApplication.class, args);
    }
}
