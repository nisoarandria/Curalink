package com.curalink.api.error;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Réponse d'erreur API unifiée pour le front : {@code error} (message principal) et
 * {@code fieldErrors} (messages par champ, ex. validation).
 */
public record ApiErrorResponse(String error, Map<String, String> fieldErrors) {

	public static ApiErrorResponse ofMessage(String error) {
		return new ApiErrorResponse(error, Collections.emptyMap());
	}

	public static ApiErrorResponse ofValidation(Map<String, String> fieldErrors) {
		String primary = fieldErrors.isEmpty()
				? "Données invalides"
				: fieldErrors.values().iterator().next();
		return new ApiErrorResponse(primary, Collections.unmodifiableMap(new LinkedHashMap<>(fieldErrors)));
	}
}
