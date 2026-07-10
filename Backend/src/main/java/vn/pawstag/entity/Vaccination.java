package vn.pawstag.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "vaccinations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vaccination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vaccination_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(nullable = false)
    private String name;

    @Column(name = "given_date")
    private LocalDate givenDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    /** Ngày đã gửi nhắc gần nhất (job nhắc lịch tiêm) — tránh nhắc trùng. */
    @Column(name = "last_reminded_on")
    private LocalDate lastRemindedOn;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
