package com.curalink.api.patient.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PatientOrdonnanceResponse(
		long id,
		long consultationId,
		long rendezVousId,
		long medecinId,
		String medecinNomComplet,
		LocalDate consultationDate,
		LocalDateTime createdAt
) {
}
