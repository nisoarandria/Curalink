package com.curalink.api.rendezvous.dto;

public record ServiceOptionResponse(
		long id,
		String nom,
		String description,
		String illustrationUrl
) {
}
