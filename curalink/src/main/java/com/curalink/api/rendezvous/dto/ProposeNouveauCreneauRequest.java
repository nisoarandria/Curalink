package com.curalink.api.rendezvous.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ProposeNouveauCreneauRequest(
		@NotNull @Future LocalDateTime dateHeure
) {
}
