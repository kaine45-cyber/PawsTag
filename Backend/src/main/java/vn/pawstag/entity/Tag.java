package vn.pawstag.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.pawstag.enums.TagStatus;
import vn.pawstag.enums.TagType;

import java.time.Instant;

@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long id;

    @Column(name = "public_code", nullable = false, unique = true)
    private String publicCode;

    private String label;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id")
    private Pet pet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TagStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TagType type;

    @Column(name = "nfc_linked", nullable = false)
    private boolean nfcLinked;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = TagStatus.UNASSIGNED;
        if (type == null) type = TagType.QR;
    }
}
