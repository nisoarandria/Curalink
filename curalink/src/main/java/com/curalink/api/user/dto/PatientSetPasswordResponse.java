package com.curalink.api.user.dto;

public record PatientSetPasswordResponse(
		String message,
		long patientId,
		String email
) {
}
