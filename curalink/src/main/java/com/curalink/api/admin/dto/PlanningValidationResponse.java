package com.curalink.api.admin.dto;

public record PlanningValidationResponse(
		long medecinId,
		int updatedCount,
		String message
) {
}
