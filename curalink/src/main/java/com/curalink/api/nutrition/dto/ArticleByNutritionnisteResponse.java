package com.curalink.api.nutrition.dto;

import java.time.LocalDateTime;

/** Article listé par auteur nutritionniste : nom d’affichage de l’auteur à la place de son id. */
public record ArticleByNutritionnisteResponse(
		long id,
		String titre,
		String contenu,
		LocalDateTime datePublication,
		String couvertureUrl,
		RubriqueSummary rubrique,
		String auteurNom
) {
}
