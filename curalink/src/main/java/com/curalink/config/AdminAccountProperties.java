package com.curalink.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.admin")
public record AdminAccountProperties(
		String email,
		String password,
		String nom,
		String prenom,
		String telephone,
		String adresse
) {
}
