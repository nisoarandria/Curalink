package com.curalink.api.admin.dto;

import com.curalink.model.disponibilite.JourSemaine;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

public record AdminDisponibiliteResponse(
		long id,
		long medecinId,
		String medecinNomComplet,
		String medecinEmail,
		LocalDate dateDebut,
		LocalDate dateFin,
		Set<JourSemaine> joursSemaine,
		LocalTime heureDebut,
		LocalTime heureFin,
		boolean planningValide
) {
}
