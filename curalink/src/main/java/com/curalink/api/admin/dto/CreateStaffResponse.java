package com.curalink.api.admin.dto;

public record CreateStaffResponse(
		long id,
		String email,
		String nom,
		String prenom,
		String telephone,
		String adresseCabinet,
		StaffRole role,
		/** Renseigné pour un médecin ; {@code null} pour un nutritionniste. */
		Long serviceId,
		/** Renseigné pour un médecin ; {@code null} pour un nutritionniste. */
		String serviceNom,
		/** Indique que le compte doit encore changer son mot de passe (première connexion). */
		boolean isFirstConnexion,
		/** Le mot de passe provisoire est envoyé par e-mail (pas renvoyé dans cette API). */
		String message
) {
}
