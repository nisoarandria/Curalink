package com.curalink.service.auth;

import com.curalink.api.auth.dto.PasswordResetAckResponse;
import com.curalink.api.auth.dto.PasswordResetConfirmDto;
import com.curalink.api.auth.dto.PasswordResetSuccessResponse;
import com.curalink.model.user.User;
import com.curalink.repository.UserRepository;
import com.curalink.service.mail.PasswordResetMailNotifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class PasswordResetService {

	private static final String ACK_MESSAGE = "Si un compte correspond à cet adresse e-mail, un message contenant un mot de passe temporaire vous a été envoyé.";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final PasswordResetMailNotifier mailNotifier;

	private final int expirationMinutes;

	public PasswordResetService(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			PasswordResetMailNotifier mailNotifier,
			@Value("${app.password-reset.expiration-minutes:60}") int expirationMinutes) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.mailNotifier = mailNotifier;
		this.expirationMinutes = Math.max(5, expirationMinutes);
	}

	/**
	 * Ne révèle pas si l’email existe (réponse identique).
	 */
	@Transactional
	public PasswordResetAckResponse requestReset(String emailRaw) {
		String email = emailRaw.trim().toLowerCase(Locale.ROOT);
		userRepository.findByEmail(email).ifPresent(user -> {
			String temporaryPassword = generateTemporaryPassword();
			user.setPasswordResetHash(passwordEncoder.encode(temporaryPassword));
			user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(expirationMinutes));
			userRepository.save(user);
			mailNotifier.sendTemporaryPassword(user.getEmail(), temporaryPassword);
		});
		return new PasswordResetAckResponse(ACK_MESSAGE);
	}

	@Transactional
	public PasswordResetSuccessResponse confirmReset(PasswordResetConfirmDto dto) {
		if (!dto.newPassword().equals(dto.confirmPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La confirmation ne correspond pas au nouveau mot de passe");
		}

		String email = dto.email().trim().toLowerCase(Locale.ROOT);
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Impossible de réinitialiser le mot de passe avec ces informations"));

		String resetHash = user.getPasswordResetHash();
		LocalDateTime expires = user.getPasswordResetExpiresAt();
		if (!StringUtils.hasText(resetHash) || expires == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Aucune demande de réinitialisation en cours pour ce compte");
		}
		if (LocalDateTime.now().isAfter(expires)) {
			clearReset(user);
			userRepository.save(user);
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le mot de passe temporaire a expiré, refaites une demande");
		}
		if (!passwordEncoder.matches(dto.temporaryPassword(), resetHash)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mot de passe temporaire incorrect");
		}

		user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
		clearReset(user);
		userRepository.save(user);

		return new PasswordResetSuccessResponse("Votre mot de passe a été mis à jour avec succès.");
	}

	private void clearReset(User user) {
		user.setPasswordResetHash(null);
		user.setPasswordResetExpiresAt(null);
	}

	private static String generateTemporaryPassword() {
		return "Aa1!" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}
}
