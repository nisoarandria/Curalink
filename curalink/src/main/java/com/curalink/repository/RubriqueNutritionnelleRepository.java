package com.curalink.repository;

import com.curalink.model.nutrition.RubriqueNutritionnelle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RubriqueNutritionnelleRepository extends JpaRepository<RubriqueNutritionnelle, Long> {

	Optional<RubriqueNutritionnelle> findByPathologie(String pathologie);
}
