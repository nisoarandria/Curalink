package com.curalink.security;

import com.curalink.api.error.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class RequireUserTypeInterceptor implements HandlerInterceptor {

	private static final Set<String> APP_ROLES = Set.of(
			"ROLE_PATIENT",
			"ROLE_MEDECIN",
			"ROLE_NUTRITIONNISTE",
			"ROLE_ADMIN");

	private final ObjectMapper objectMapper;

	public RequireUserTypeInterceptor(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			return true;
		}
		if (!(handler instanceof HandlerMethod hm)) {
			return true;
		}

		RequireUserTypes rule = hm.getMethodAnnotation(RequireUserTypes.class);
		if (rule == null) {
			rule = AnnotatedElementUtils.findMergedAnnotation(hm.getBeanType(), RequireUserTypes.class);
		}
		if (rule == null) {
			return true;
		}

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth instanceof AnonymousAuthenticationToken) {
			writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentification requise");
			return false;
		}

		UserType[] allowed = rule.value();
		if (allowed.length == 0) {
			if (hasAnyAppRole(auth)) {
				return true;
			}
			writeError(response, HttpServletResponse.SC_FORBIDDEN, "Accès refusé");
			return false;
		}

		Set<String> authorities = auth.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.collect(Collectors.toSet());

		for (UserType ut : allowed) {
			if (authorities.contains("ROLE_" + ut.name())) {
				return true;
			}
		}

		writeError(response, HttpServletResponse.SC_FORBIDDEN, "Accès refusé pour ce profil");
		return false;
	}

	private static boolean hasAnyAppRole(Authentication auth) {
		return auth.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.anyMatch(APP_ROLES::contains);
	}

	private void writeError(HttpServletResponse response, int status, String message) {
		try {
			response.setStatus(status);
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write(objectMapper.writeValueAsString(ApiErrorResponse.ofMessage(message)));
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}
}
