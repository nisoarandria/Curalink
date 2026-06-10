package com.curalink.api.notification.dto;

import com.curalink.model.notification.RendezVousNotificationLabel;

import java.time.LocalDateTime;

public record NotificationResponse(
		long id,
		long rendezVousId,
		String message,
		LocalDateTime dateHeure,
		RendezVousNotificationLabel label,
		boolean lu,
		LocalDateTime createdAt
) {
}
