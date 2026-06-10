package com.curalink.api.patient.dto;

import com.curalink.model.user.Sexe;

import java.time.LocalDate;

public record PatientProfileResponse(
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
