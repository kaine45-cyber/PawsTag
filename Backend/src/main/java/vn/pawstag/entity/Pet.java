package vn.pawstag.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pet_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private Owner owner;

    // ── cơ bản ──
    @Column(nullable = false)
    private String name;

    private String type;          // species: dog/cat/...
    private String breed;
    private String color;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    private BigDecimal weight;
    private String gender;
    private String collar;

    @Column(name = "contact_phone")
    private String contactPhone;  // số "Call Owner" trên tag

    // ── y tế ──
    @Column(nullable = false)
    private boolean vaccinated;

    @Column(name = "blood_type")
    private String bloodType;

    @Column(name = "microchip_id")
    private String microchipId;

    @Column(name = "eye_color")
    private String eyeColor;

    @Column(nullable = false)
    private boolean neutered;

    @Column(name = "neutered_date")
    private LocalDate neuteredDate;

    private String diet;

    @Column(name = "implant_date")
    private LocalDate implantDate;

    @Column(name = "implant_location")
    private String implantLocation;

    @Column(columnDefinition = "text")
    private String allergies;

    @Column(columnDefinition = "text")
    private String conditions;

    @Column(columnDefinition = "text")
    private String medications;

    @Column(name = "last_vet_visit")
    private LocalDate lastVetVisit;

    @Column(name = "vet_name")
    private String vetName;

    @Column(name = "vet_phone")
    private String vetPhone;

    @Column(name = "medical_info", columnDefinition = "text")
    private String medicalInfo;

    @Column(name = "identification_notes", columnDefinition = "text")
    private String identificationNotes;

    @Column(name = "emergency_message", columnDefinition = "text")
    private String emergencyMessage;

    @Column(name = "photo_url")
    private String photoUrl;

    // ── privacy (mặc định công khai) ──
    @Builder.Default
    @Column(name = "show_phone", nullable = false)
    private boolean showPhone = true;

    @Builder.Default
    @Column(name = "show_owner_name", nullable = false)
    private boolean showOwnerName = true;

    @Builder.Default
    @Column(name = "show_location", nullable = false)
    private boolean showLocation = true;

    // ── lost mode ──
    @Column(name = "is_lost", nullable = false)
    private boolean lost;

    @Column(name = "lost_message", columnDefinition = "text")
    private String lostMessage;

    @Column(name = "reward_amount")
    private BigDecimal rewardAmount;

    @Column(name = "alert_radius_km")
    private Integer alertRadiusKm;

    @Column(name = "lost_since")
    private Instant lostSince;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("priority ASC")
    @Builder.Default
    private List<EmergencyContact> emergencyContacts = new ArrayList<>();

    public void addEmergencyContact(EmergencyContact c) {
        c.setPet(this);
        emergencyContacts.add(c);
    }

    public void clearEmergencyContacts() {
        emergencyContacts.clear();
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (alertRadiusKm == null) alertRadiusKm = 5;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
