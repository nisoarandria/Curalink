package com.curalink.api.auth;

import com.curalink.api.auth.dto.ChangePasswordRequest;
import com.curalink.api.auth.dto.LoginRequest;
import com.curalink.api.auth.dto.LoginResponse;
import com.curalink.api.auth.dto.LogoutResponse;
import com.curalink.api.auth.dto.PasswordChangeSuccessResponse;
import com.curalink.api.auth.dto.PasswordResetAckResponse;
import com.curalink.api.auth.dto.PasswordResetConfirmDto;
import com.curalink.api.auth.dto.PasswordResetRequestDto;
import com.curalink.api.auth.dto.PasswordResetSuccessResponse;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.service.auth.AuthService;
import com.curalink.service.auth.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final PasswordResetService passwordResetService;

	public AuthController(AuthService authService, PasswordResetService passwordResetService) {
		this.authService = authService;
		this.passwordResetService = passwordResetService;
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
		return ResponseEntity.ok(authService.login(request));
	}

	/**
	 * Déconnexion logique pour JWT stateless : le front doit supprimer le token localement.
	 */
	@PostMapping("/logout")
	@RequireUserTypes
	public ResponseEntity<LogoutResponse> logout(@AuthenticationPrincipal AuthenticatedUser currentUser) {
		return ResponseEntity.ok(new LogoutResponse("Déconnexion effectuée", Instant.now()));
	}

	/**
	 * Demande de réinitialisation : envoie un mot de passe temporaire par e-mail si le compte existe.
	 */
	@PostMapping("/password-reset/request")
	public ResponseEntity<PasswordResetAckResponse> requestPasswordReset(@Valid @RequestBody PasswordResetRequestDto request) {
		return ResponseEntity.ok(passwordResetService.requestReset(request.email()));
	}

	/**
	 * Saisie du mot de passe reçu par e-mail + nouveau mot de passe et confirmation.
	 */
	@PostMapping("/password-reset/confirm")
	public ResponseEntity<PasswordResetSuccessResponse> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmDto request) {
		return ResponseEntity.ok(passwordResetService.confirmReset(request));
	}

	/**
	 * Changement de mot de passe pour l’utilisateur connecté (JWT). Si {@code isFirstConnexion} était vrai,
	 * il passe à faux après succès.
	 */
	@PutMapping("/password")
	@RequireUserTypes
	public ResponseEntity<PasswordChangeSuccessResponse> changePassword(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@Valid @RequestBody ChangePasswordRequest request) {
		return ResponseEntity.ok(authService.changePassword(currentUser, request));
	}
}
