package com.curalink.api.nutrition.dto;

import java.time.LocalDateTime;

public record ArticleResponse(
		long id,
		String titre,
		String contenu,
		LocalDateTime datePublication,
		String couvertureUrl,
		RubriqueSummary rubrique,
		long auteurId
) {
}
