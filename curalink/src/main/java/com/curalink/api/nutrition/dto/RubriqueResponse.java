package com.curalink.api.nutrition.dto;

public record RubriqueResponse(
		long id,
		String titre,
		String description,
		String pathologie
) {
}
