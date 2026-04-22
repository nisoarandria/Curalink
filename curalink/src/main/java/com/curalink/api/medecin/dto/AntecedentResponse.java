package com.curalink.api.medecin.dto;

import java.time.LocalDateTime;

public record AntecedentResponse(
		long id,
		long patientId,
		String description,
		LocalDateTime createdAt
) {
}
