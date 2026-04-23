package com.curalink.service.nutrition;

import com.curalink.model.nutrition.Article;
import com.curalink.model.nutrition.RubriqueNutritionnelle;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class ArticleSpecifications {

	private ArticleSpecifications() {
	}

	public static Specification<Article> withFilters(
			String q,
			String pathologie,
			LocalDate dateDebut,
			LocalDate dateFin,
			Long auteurUserId) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new ArrayList<>();

			if (auteurUserId != null) {
				predicates.add(cb.equal(root.join("auteur", JoinType.INNER).get("id"), auteurUserId));
			}

			if (StringUtils.hasText(q)) {
				String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
				predicates.add(cb.like(cb.lower(root.get("titre")), pattern));
			}

			if (StringUtils.hasText(pathologie)) {
				Join<Article, RubriqueNutritionnelle> rubrique = root.join("rubrique", JoinType.INNER);
				predicates.add(cb.equal(rubrique.get("pathologie"), pathologie.trim().toUpperCase(Locale.ROOT)));
			}

			if (dateDebut != null) {
				predicates.add(cb.greaterThanOrEqualTo(root.get("datePublication"), dateDebut.atStartOfDay()));
			}
			if (dateFin != null) {
				predicates.add(cb.lessThan(root.get("datePublication"), dateFin.plusDays(1).atStartOfDay()));
			}

			if (predicates.isEmpty()) {
				return cb.conjunction();
			}
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}
}
