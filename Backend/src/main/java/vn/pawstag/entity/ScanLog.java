package vn.pawstag.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "scan_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScanLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scan_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    private Double latitude;
    private Double longitude;

    @Column(name = "location_name")
    private String locationName;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "scanned_at", nullable = false)
    private Instant scannedAt;

    @PrePersist
    void onCreate() {
        if (scannedAt == null) scannedAt = Instant.now();
    }
}
