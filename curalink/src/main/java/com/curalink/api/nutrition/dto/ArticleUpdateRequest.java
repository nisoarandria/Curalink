package com.curalink.api.nutrition.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ArticleUpdateRequest(
		@NotBlank String titre,
		@NotBlank String contenu,
		@NotNull Long rubriqueId,
		@NotNull LocalDateTime datePublication
) {
}
