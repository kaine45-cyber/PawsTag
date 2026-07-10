package vn.pawstag.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.pawstag.entity.Pet;
import vn.pawstag.entity.Vaccination;
import vn.pawstag.enums.NotificationType;
import vn.pawstag.repository.VaccinationRepository;
import vn.pawstag.service.NotificationService;

import java.time.LocalDate;
import java.util.List;

/**
 * Nhắc lịch tiêm chủng: quét các mũi tiêm sắp đến hạn / quá hạn và tạo
 * notification MEDICAL cho owner.
 *
 * Lịch chạy: 8:00 sáng hằng ngày + chạy bù ngay khi app khởi động.
 * Chống spam: mỗi mũi tiêm nhắc tối đa 1 lần / REMIND_EVERY_DAYS ngày
 * (ghi last_reminded_on), và ngừng nhắc khi quá hạn hơn EXPIRED_GRACE_DAYS.
 */
@Component
public class VaccinationReminderJob {

    private static final Logger log = LoggerFactory.getLogger(VaccinationReminderJob.class);

    private static final int DUE_SOON_DAYS      = 14; // nhắc trước hạn 14 ngày
    private static final int EXPIRED_GRACE_DAYS = 30; // quá hạn vẫn nhắc thêm 30 ngày
    private static final int REMIND_EVERY_DAYS  = 7;  // tối đa 1 lần / 7 ngày / mũi

    private final VaccinationRepository vaccinationRepository;
    private final NotificationService notificationService;

    public VaccinationReminderJob(VaccinationRepository vaccinationRepository,
                                  NotificationService notificationService) {
        this.vaccinationRepository = vaccinationRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "0 0 8 * * *")            // 8:00 sáng hằng ngày
    @EventListener(ApplicationReadyEvent.class)  // chạy bù khi khởi động (dedup nhờ last_reminded_on)
    @Transactional
    public void run() {
        LocalDate today = LocalDate.now();
        List<Vaccination> due = vaccinationRepository.findDueBetween(
                today.minusDays(EXPIRED_GRACE_DAYS), today.plusDays(DUE_SOON_DAYS));

        int sent = 0;
        for (Vaccination v : due) {
            // Đã nhắc trong REMIND_EVERY_DAYS ngày gần đây → bỏ qua
            if (v.getLastRemindedOn() != null
                    && v.getLastRemindedOn().isAfter(today.minusDays(REMIND_EVERY_DAYS))) {
                continue;
            }
            Pet pet = v.getPet();
            if (pet == null || pet.getOwner() == null) continue;

            boolean overdue = v.getDueDate().isBefore(today);
            String title = overdue ? "💉 Vaccination overdue" : "💉 Vaccination due soon";
            String message = pet.getName() + "'s " + v.getName() + " vaccination "
                    + (overdue ? "was" : "is") + " due on " + v.getDueDate() + ".";

            notificationService.create(pet.getOwner(), pet, NotificationType.MEDICAL, title, message);
            v.setLastRemindedOn(today);   // entity managed → dirty checking tự lưu
            sent++;
        }
        if (sent > 0) log.info("Vaccination reminders sent: {}", sent);
    }
}
