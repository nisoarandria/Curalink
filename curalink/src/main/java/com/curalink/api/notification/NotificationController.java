package com.curalink.api.notification;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.notification.dto.NotificationResponse;
import com.curalink.api.notification.dto.NotificationSummaryResponse;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.notification.NotificationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequireUserTypes({ UserType.MEDECIN, UserType.PATIENT })
public class NotificationController {

	private final NotificationService notificationService;

	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	/**
	 * Flux SSE temps réel : le client reçoit un événement {@code notification} à chaque nouvelle notif.
	 * Auth via header Bearer ou query {@code ?access_token=<jwt>} (requis pour EventSource).
	 */
	@GetMapping(value = "/me/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter streamMine(@AuthenticationPrincipal AuthenticatedUser currentUser) {
		return notificationService.subscribeStream(currentUser);
	}

	@GetMapping("/me")
	public ResponseEntity<PageResponse<NotificationResponse>> listMine(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return ResponseEntity.ok(notificationService.listMine(currentUser, page, size));
	}

	@GetMapping("/me/non-lues")
	public ResponseEntity<NotificationSummaryResponse> countUnread(
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		return ResponseEntity.ok(notificationService.countUnread(currentUser));
	}

	@PatchMapping("/{id}/lu")
	public ResponseEntity<NotificationResponse> markAsRead(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		return ResponseEntity.ok(notificationService.markAsRead(currentUser, id));
	}

	@PatchMapping("/me/lire-tout")
	public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal AuthenticatedUser currentUser) {
		notificationService.markAllAsRead(currentUser);
		return ResponseEntity.noContent().build();
	}
}
