package com.curalink.api.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record LoginResponse(
		String accessToken,
		String tokenType,
		/** Durée de validité en secondes (alignée sur le claim {@code exp} du JWT). */
		long expiresIn,
		/** Date d’expiration du token (UTC). */
		Instant expiresAt,
		UserInfo user
) {
	public record UserInfo(
			long id,
			String email,
			/** PATIENT, MEDECIN ou NUTRITIONNISTE (identique au claim {@code userType} du JWT). */
			String userType,
			String nom,
			String prenom,
			@JsonProperty("isFirstConnexion") boolean firstConnexion
	) {
	}
}
