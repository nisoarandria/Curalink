package com.curalink.service.notification;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.notification.dto.NotificationResponse;
import com.curalink.api.notification.dto.NotificationSummaryResponse;
import com.curalink.model.notification.Notification;
import com.curalink.model.notification.RendezVousNotificationLabel;
import com.curalink.model.user.User;
import com.curalink.repository.NotificationRepository;
import com.curalink.repository.UserRepository;
import com.curalink.security.AuthenticatedUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;

@Service
public class NotificationService {

	private static final int MAX_PAGE_SIZE = 100;

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;
	private final NotificationSseHub notificationSseHub;

	public NotificationService(
			NotificationRepository notificationRepository,
			UserRepository userRepository,
			NotificationSseHub notificationSseHub) {
		this.notificationRepository = notificationRepository;
		this.userRepository = userRepository;
		this.notificationSseHub = notificationSseHub;
	}

	@Transactional
	public NotificationResponse create(
			long recipientId,
			long rendezVousId,
			String message,
			LocalDateTime dateHeure,
			RendezVousNotificationLabel label) {
		User recipient = userRepository.findById(recipientId)
				.orElseThrow(() -> new IllegalStateException("Destinataire notification introuvable: " + recipientId));
		Notification saved = notificationRepository.save(new Notification(
				recipient,
				rendezVousId,
				message,
				dateHeure,
				label));
		NotificationResponse response = toResponse(saved);
		notificationSseHub.publish(recipientId, response);
		return response;
	}

	public SseEmitter subscribeStream(AuthenticatedUser currentUser) {
		requireUser(currentUser);
		String userType = currentUser.userType();
		if (!"MEDECIN".equals(userType) && !"PATIENT".equals(userType)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Flux notifications réservé aux patients et médecins");
		}
		return notificationSseHub.subscribe(currentUser.userId());
	}

	@Transactional(readOnly = true)
	public PageResponse<NotificationResponse> listMine(AuthenticatedUser currentUser, int page, int size) {
		requireUser(currentUser);
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
		return PageResponse.from(notificationRepository
				.findByRecipientIdOrderByCreatedAtDesc(currentUser.userId(), pageable)
				.map(NotificationService::toResponse));
	}

	@Transactional(readOnly = true)
	public NotificationSummaryResponse countUnread(AuthenticatedUser currentUser) {
		requireUser(currentUser);
		long count = notificationRepository.countByRecipientIdAndLuFalse(currentUser.userId());
		return new NotificationSummaryResponse(count);
	}

	@Transactional
	public NotificationResponse markAsRead(AuthenticatedUser currentUser, long notificationId) {
		requireUser(currentUser);
		Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification introuvable"));
		notification.setLu(true);
		return toResponse(notification);
	}

	@Transactional
	public void markAllAsRead(AuthenticatedUser currentUser) {
		requireUser(currentUser);
		notificationRepository.markAllAsReadForRecipient(currentUser.userId());
	}

	private static void requireUser(AuthenticatedUser currentUser) {
		if (currentUser == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifié");
		}
	}

	private static NotificationResponse toResponse(Notification n) {
		return new NotificationResponse(
				n.getId(),
				n.getRendezVousId(),
				n.getMessage(),
				n.getDateHeure(),
				n.getLabel(),
				n.isLu(),
				n.getCreatedAt());
	}

	private static int clampSize(int size) {
		return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
	}
}
