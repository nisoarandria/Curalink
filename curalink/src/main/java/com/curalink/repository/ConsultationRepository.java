package com.curalink.repository;

import com.curalink.model.consultation.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
	List<Consultation> findByPatientIdAndMedecinIdOrderByDateDescIdDesc(Long patientId, Long medecinId);
}
