package com.curalink.api.orientation.dto;

import jakarta.validation.constraints.NotBlank;

public record MedicalChatRequest(
		@NotBlank String message
) {
}
