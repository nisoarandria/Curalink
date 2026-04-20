package com.curalink.api.admin.dto;

public record ServiceItemResponse(
		long id,
		String nom,
		String description,
		/** URL publique de l'illustration (Supabase Storage). */
		String illustrationUrl
) {
}
