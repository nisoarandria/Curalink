package com.curalink.service.notification;

import com.curalink.api.notification.dto.NotificationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class NotificationSseHub {

	private static final Logger log = LoggerFactory.getLogger(NotificationSseHub.class);

	private final ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> emittersByUser =
			new ConcurrentHashMap<>();

	public SseEmitter subscribe(long userId) {
		SseEmitter emitter = new SseEmitter(0L);
		emittersByUser.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>()).add(emitter);

		Runnable cleanup = () -> removeEmitter(userId, emitter);
		emitter.onCompletion(cleanup);
		emitter.onTimeout(cleanup);
		emitter.onError(ex -> cleanup.run());

		try {
			emitter.send(SseEmitter.event().name("connected").data("ok"));
		} catch (IOException ex) {
			cleanup.run();
			throw new IllegalStateException("Impossible d'ouvrir le flux SSE", ex);
		}

		return emitter;
	}

	public void publish(long userId, NotificationResponse notification) {
		List<SseEmitter> emitters = emittersByUser.get(userId);
		if (emitters == null || emitters.isEmpty()) {
			return;
		}
		for (SseEmitter emitter : emitters) {
			try {
				emitter.send(SseEmitter.event().name("notification").data(notification));
			} catch (IOException ex) {
				log.debug("Flux SSE notification fermé pour l'utilisateur {}", userId);
				removeEmitter(userId, emitter);
			}
		}
	}

	private void removeEmitter(long userId, SseEmitter emitter) {
		CopyOnWriteArrayList<SseEmitter> emitters = emittersByUser.get(userId);
		if (emitters == null) {
			return;
		}
		emitters.remove(emitter);
		if (emitters.isEmpty()) {
			emittersByUser.remove(userId, emitters);
		}
		try {
			emitter.complete();
		} catch (Exception ignored) {
			// déjà fermé
		}
	}
}
