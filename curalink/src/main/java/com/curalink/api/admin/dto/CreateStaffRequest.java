package com.curalink.api.admin.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateStaffRequest(
		@NotBlank @Email String email,
		@NotBlank String nom,
		@NotBlank String prenom,
		@NotBlank String telephone,
		@NotBlank @JsonAlias("adresse") String adresseCabinet,
		String numeroInscription,
		@NotNull StaffRole role,
		/** Obligatoire si role = MEDECIN (id d’un service du catalogue). Ignoré pour un nutritionniste. */
		Long serviceId
) {
}
