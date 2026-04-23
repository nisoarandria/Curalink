package com.curalink.repository;

import com.curalink.model.nutrition.RubriqueNutritionnelle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.curalink.api.nutrition.dto.RubriqueArticleCountResponse;
import java.util.List;
import java.util.Optional;

public interface RubriqueNutritionnelleRepository extends JpaRepository<RubriqueNutritionnelle, Long> {

	Optional<RubriqueNutritionnelle> findByPathologie(String pathologie);

	@Query("""
			SELECT new com.curalink.api.nutrition.dto.RubriqueArticleCountResponse(
				r.id,
				r.titre,
				COUNT(a.id)
			)
			FROM RubriqueNutritionnelle r
			LEFT JOIN Article a ON a.rubrique.id = r.id
			GROUP BY r.id, r.titre
			ORDER BY r.titre ASC
			""")
	List<RubriqueArticleCountResponse> findRubriquesWithArticleCount();
}
