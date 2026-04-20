package com.curalink.api.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PasswordChangeSuccessResponse(
		String message,
		@JsonProperty("isFirstConnexion") boolean firstConnexion
) {
}
