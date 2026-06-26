package vn.pawstag.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.pawstag.entity.EmergencyContact;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {
}
