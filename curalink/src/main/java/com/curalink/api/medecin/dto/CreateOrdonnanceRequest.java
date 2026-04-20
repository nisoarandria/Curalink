package com.curalink.api.medecin.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateOrdonnanceRequest(
		@NotBlank String prescription
) {
}
