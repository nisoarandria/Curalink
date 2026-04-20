package com.curalink.api.medecin.dto;

import com.curalink.model.rendezvous.RendezVousStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRendezVousStatusRequest(
		@NotNull RendezVousStatus status
) {
}
