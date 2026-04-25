package com.curalink.api.medecin.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ConstanteVitaleResponse(
		long id,
		long patientId,
		LocalDate date,
		BigDecimal glycemie,
		String tension,
		BigDecimal poids,
		BigDecimal imc
) {
}
