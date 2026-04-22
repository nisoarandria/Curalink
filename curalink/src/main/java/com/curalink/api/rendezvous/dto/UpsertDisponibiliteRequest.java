package com.curalink.api.rendezvous.dto;

import com.curalink.model.disponibilite.JourSemaine;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

public record UpsertDisponibiliteRequest(
		LocalDate date,
		LocalDate dateDebut,
		LocalDate dateFin,
		Set<JourSemaine> joursSemaine,
		@NotNull LocalTime heureDebut,
		@NotNull LocalTime heureFin
) {
}
