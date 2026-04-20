package com.curalink.security;

import com.curalink.config.JwtProperties;
import com.curalink.model.user.Admin;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Nutritionniste;
import com.curalink.model.user.Patient;
import com.curalink.model.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

	private static final String CLAIM_USER_TYPE = "userType";
	private static final String CLAIM_EMAIL = "email";
	private static final String CLAIM_NOM = "nom";
	private static final String CLAIM_PRENOM = "prenom";

	private final JwtProperties jwtProperties;
	private final String issuer;

	public JwtService(JwtProperties jwtProperties,
			@Value("${spring.application.name:healthcare}") String issuer) {
		this.jwtProperties = jwtProperties;
		this.issuer = issuer;
	}

	public String generateAccessToken(User user) {
		if (jwtProperties.secret() == null || jwtProperties.secret().isBlank()) {
			throw new IllegalStateException("app.jwt.secret doit être défini");
		}

		Instant now = Instant.now();
		Instant exp = now.plusMillis(jwtProperties.expirationMs());
		String userType = resolveUserType(user);

		return Jwts.builder()
				.id(UUID.randomUUID().toString())
				.issuer(issuer)
				.subject(String.valueOf(user.getId()))
				.claim(CLAIM_EMAIL, user.getEmail())
				.claim(CLAIM_USER_TYPE, userType)
				.claim(CLAIM_NOM, user.getNom())
				.claim(CLAIM_PRENOM, user.getPrenom())
				.issuedAt(Date.from(now))
				.expiration(Date.from(exp))
				.signWith(signingKey())
				.compact();
	}

	public Claims parseToken(String token) throws JwtException {
		return Jwts.parser()
				.verifyWith(signingKey())
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public AuthenticatedUser toAuthenticatedUser(Claims claims) {
		return new AuthenticatedUser(
				Long.parseLong(claims.getSubject()),
				claims.get(CLAIM_EMAIL, String.class),
				claims.get(CLAIM_USER_TYPE, String.class));
	}

	public long getExpirationMs() {
		return jwtProperties.expirationMs();
	}

	private SecretKey signingKey() {
		try {
			MessageDigest sha = MessageDigest.getInstance("SHA-256");
			byte[] hash = sha.digest(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
			return Keys.hmacShaKeyFor(hash);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}

	public static String resolveUserType(User user) {
		if (user instanceof Patient) {
			return "PATIENT";
		}
		if (user instanceof Medecin) {
			return "MEDECIN";
		}
		if (user instanceof Nutritionniste) {
			return "NUTRITIONNISTE";
		}
		if (user instanceof Admin) {
			return "ADMIN";
		}
		return "USER";
	}
}
