package com.curalink.api.medecin.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateConstanteVitaleRequest(
		@NotNull LocalDate date,
		BigDecimal glycemie,
		String tension,
		BigDecimal poids,
		BigDecimal imc
) {
}
