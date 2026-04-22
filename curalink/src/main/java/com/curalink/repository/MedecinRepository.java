package com.curalink.repository;

import com.curalink.model.user.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedecinRepository extends JpaRepository<Medecin, Long> {
	List<Medecin> findByServiceIdOrderByNomAscPrenomAsc(Long serviceId);
}
