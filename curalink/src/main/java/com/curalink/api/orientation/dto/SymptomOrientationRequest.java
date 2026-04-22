package com.curalink.api.orientation.dto;

import jakarta.validation.constraints.NotBlank;

public record SymptomOrientationRequest(
		@NotBlank String message
) {
}
