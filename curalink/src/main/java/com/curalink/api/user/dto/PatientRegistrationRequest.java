package com.curalink.api.user.dto;

import com.curalink.model.user.Sexe;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PatientRegistrationRequest(
		@NotBlank String nom,
		@NotBlank String prenom,
		@NotBlank String telephone,
		@NotBlank String adresse,
		@NotNull Sexe sexe,
		@NotNull LocalDate dateNaissance,
		@NotBlank @Email String email
) {
}
