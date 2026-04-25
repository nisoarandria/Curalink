package com.curalink.api.nutrition.dto;

public record RubriqueArticleCountResponse(
		Long rubriqueId,
		String nomRubrique,
		long nombreArticles) {
}
