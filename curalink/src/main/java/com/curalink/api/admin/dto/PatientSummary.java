package com.curalink.api.admin.dto;

import com.curalink.model.user.Sexe;

import java.time.LocalDate;

public record PatientSummary(
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
