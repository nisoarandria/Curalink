package com.curalink.api.rendezvous.dto;

public record MedecinOptionResponse(
		long id,
		String nom,
		String specialite,
		String adresseCabinet,
		String numeroInscription
) {
}
