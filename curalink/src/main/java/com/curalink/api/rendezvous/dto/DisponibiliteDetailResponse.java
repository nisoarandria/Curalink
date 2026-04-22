package com.curalink.api.rendezvous.dto;

import com.curalink.model.disponibilite.JourSemaine;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

public record DisponibiliteDetailResponse(
		long id,
		LocalDate dateDebut,
		LocalDate dateFin,
		Set<JourSemaine> joursSemaine,
		LocalTime heureDebut,
		LocalTime heureFin,
		boolean planningValide
) {
}
