package com.curalink.api.rendezvous.dto;

import com.curalink.model.rendezvous.RendezVousStatus;

import java.time.LocalDateTime;

public record RendezVousResponse(
		long id,
		LocalDateTime dateHeure,
		RendezVousStatus status,
		long serviceId,
		String serviceNom,
		long patientId,
		String patientNomComplet,
		long medecinId,
		String medecinNomComplet,
		String specialite,
		String adresseCabinet
) {
}
