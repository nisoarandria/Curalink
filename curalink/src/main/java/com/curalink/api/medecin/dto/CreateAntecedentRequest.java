package com.curalink.api.medecin.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAntecedentRequest(
		@NotBlank String description
) {
}
