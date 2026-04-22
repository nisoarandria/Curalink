package com.curalink.api.admin.dto;

/** Référence minimale à un service du catalogue (pour les médecins). */
public record ServiceSummary(
		long id,
		String nom
) {
}
