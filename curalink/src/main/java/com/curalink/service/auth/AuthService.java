package com.curalink.service.auth;

import com.curalink.api.auth.dto.ChangePasswordRequest;
import com.curalink.api.auth.dto.LoginRequest;
import com.curalink.api.auth.dto.LoginResponse;
import com.curalink.api.auth.dto.PasswordChangeSuccessResponse;
import com.curalink.model.user.User;
import com.curalink.repository.UserRepository;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	@Transactional
	public PasswordChangeSuccessResponse changePassword(AuthenticatedUser currentUser, ChangePasswordRequest request) {
		if (!request.newPassword().equals(request.confirmPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La confirmation ne correspond pas au nouveau mot de passe");
		}

		User user = userRepository.findById(currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

		String hash = user.getPasswordHash();
		if (hash == null || !passwordEncoder.matches(request.oldPassword(), hash)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Ancien mot de passe incorrect");
		}
		if (passwordEncoder.matches(request.newPassword(), hash)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Le nouveau mot de passe doit être différent de l'ancien");
		}

		boolean wasFirst = user.isFirstConnexion();
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		if (wasFirst) {
			user.setFirstConnexion(false);
		}
		userRepository.save(user);

		return new PasswordChangeSuccessResponse(
				"Mot de passe mis à jour avec succès.",
				user.isFirstConnexion());
	}

	public LoginResponse login(LoginRequest request) {
		String email = request.email().trim().toLowerCase(Locale.ROOT);
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides"));

		String hash = user.getPasswordHash();
		if (hash == null || !passwordEncoder.matches(request.password(), hash)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides");
		}

		String token = jwtService.generateAccessToken(user);
		long expSeconds = jwtService.getExpirationMs() / 1000;
		Instant expiresAt = Instant.now().plusMillis(jwtService.getExpirationMs());
		String userType = JwtService.resolveUserType(user);

		var userInfo = new LoginResponse.UserInfo(
				user.getId(),
				user.getEmail(),
				userType,
				user.getNom(),
				user.getPrenom(),
				user.isFirstConnexion());

		return new LoginResponse(token, "Bearer", expSeconds, expiresAt, userInfo);
	}
}
