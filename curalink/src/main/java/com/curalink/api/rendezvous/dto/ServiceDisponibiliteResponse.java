package com.curalink.api.rendezvous.dto;

import java.time.LocalTime;

public record ServiceDisponibiliteResponse(
		long medecinId,
		String medecinNom,
		LocalTime heure
) {
}
