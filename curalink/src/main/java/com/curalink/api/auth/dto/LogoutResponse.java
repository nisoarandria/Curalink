package com.curalink.api.auth.dto;

import java.time.Instant;

public record LogoutResponse(
		String message,
		Instant loggedOutAt
) {
}
