package com.curalink.repository;

import com.curalink.model.consultation.AntecedentMedical;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AntecedentMedicalRepository extends JpaRepository<AntecedentMedical, Long> {
	List<AntecedentMedical> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
