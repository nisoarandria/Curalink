package com.curalink.security;

/**
 * Principal Spring Security après authentification JWT.
 */
public record AuthenticatedUser(Long userId, String email, String userType) {
}
