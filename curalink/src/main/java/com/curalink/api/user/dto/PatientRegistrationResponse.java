package com.curalink.api.user.dto;

import com.curalink.model.user.Patient;
import com.curalink.model.user.Sexe;

import java.time.LocalDate;

public record PatientRegistrationResponse(
		Long id,
		String nom,
		String prenom,
		String email,
		String telephone,
		String adresse,
		Sexe sexe,
		LocalDate dateNaissance
) {
	public static PatientRegistrationResponse from(Patient patient) {
		return new PatientRegistrationResponse(
				patient.getId(),
				patient.getNom(),
				patient.getPrenom(),
				patient.getEmail(),
				patient.getTelephone(),
				patient.getAdresse(),
				patient.getSexe(),
				patient.getDateNaissance());
	}
}
