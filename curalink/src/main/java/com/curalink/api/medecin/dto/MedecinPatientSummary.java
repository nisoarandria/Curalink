package com.curalink.api.medecin.dto;

import com.curalink.model.user.Sexe;

import java.time.LocalDate;

public record MedecinPatientSummary(
		long id,
		String email,
		String nom,
		String prenom,
		String telephone,
		String adresse,
		LocalDate dateNaissance,
		Sexe sexe
) {
}
