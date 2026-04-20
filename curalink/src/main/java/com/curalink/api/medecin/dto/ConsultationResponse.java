package com.curalink.api.medecin.dto;

import java.time.LocalDate;

public record ConsultationResponse(
		long id,
		long rendezVousId,
		long patientId,
		long medecinId,
		String motif,
		String diagnostic,
		LocalDate date
) {
}
