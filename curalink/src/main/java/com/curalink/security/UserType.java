package com.curalink.security;

/**
 * Profils alignés sur le claim JWT {@code userType} et les autorités {@code ROLE_*}.
 */
public enum UserType {
	PATIENT,
	MEDECIN,
	NUTRITIONNISTE,
	ADMIN
}
