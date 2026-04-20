package com.curalink.api.orientation.dto;

public record SymptomOrientationResponse(
		Long serviceId,
		String serviceNom,
		String raison,
		double confidence,
		String messageSecurite
) {
}
