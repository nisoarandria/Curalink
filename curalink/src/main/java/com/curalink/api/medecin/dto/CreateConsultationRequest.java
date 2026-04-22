package com.curalink.api.medecin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateConsultationRequest(
		@NotNull Long rendezVousId,
		@NotNull Long patientId,
		@NotNull Long medecinId,
		@NotBlank String motif,
		@NotBlank String diagnostic,
		@NotNull LocalDate date
) {
}
