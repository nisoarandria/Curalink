package com.curalink.repository;

import com.curalink.model.consultation.ConstanteVitale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConstanteVitaleRepository extends JpaRepository<ConstanteVitale, Long> {
	List<ConstanteVitale> findByPatientIdOrderByDateDescIdDesc(Long patientId);
}
