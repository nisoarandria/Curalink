package com.curalink.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.services.catalog")
public record ServiceItemStorageProperties(
		/** URL de projet Supabase (ex. https://xxxx.supabase.co). */
		String supabaseUrl,
		/** Bucket storage cible pour les illustrations (ex. service-images). */
		String bucket,
		/** Clé API Supabase (service role recommandée pour upload/delete serveur). */
		String apiKey
) {
}
