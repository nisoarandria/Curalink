package com.curalink.api.medecin.dto;

import java.time.LocalDateTime;

public record OrdonnanceResponse(
		long id,
		long consultationId,
		LocalDateTime createdAt,
		String message
) {
}
