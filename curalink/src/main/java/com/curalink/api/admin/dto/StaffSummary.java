package com.curalink.api.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record StaffSummary(
		long id,
		String email,
		String nom,
		String prenom,
		String telephone,
		String adresseCabinet,
		StaffRole role,
		/** Renseigné pour les médecins ; {@code null} pour les nutritionnistes. */
		ServiceSummary service,
		@JsonProperty("isFirstConnexion") boolean firstConnexion
) {
}
