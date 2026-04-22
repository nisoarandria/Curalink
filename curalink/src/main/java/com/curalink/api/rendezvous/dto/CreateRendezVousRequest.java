package com.curalink.api.rendezvous.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record CreateRendezVousRequest(
		@NotNull @Future LocalDateTime dateHeure,
		@NotNull Long serviceId,
		@NotNull Long medecinId
) {
}
