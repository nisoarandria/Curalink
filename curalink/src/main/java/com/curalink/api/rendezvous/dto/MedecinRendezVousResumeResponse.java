package com.curalink.api.rendezvous.dto;

import java.util.List;

public record MedecinRendezVousResumeResponse(
		List<RendezVousResponse> historiques3DerniersMois5Derniers,
		List<RendezVousResponse> prochains5RendezVous
) {
}
