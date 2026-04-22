package com.curalink.api.rendezvous.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record MedecinDisponibiliteResponse(
		LocalDate date,
		LocalTime heure
) {
}
