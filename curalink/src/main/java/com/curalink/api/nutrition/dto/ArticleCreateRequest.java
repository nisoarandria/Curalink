package com.curalink.api.nutrition.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ArticleCreateRequest(
		@NotBlank String titre,
		@NotBlank String contenu,
		@NotNull Long rubriqueId,
		/** Si absent, date/heure courantes au moment de la création. */
		LocalDateTime datePublication
) {
}
