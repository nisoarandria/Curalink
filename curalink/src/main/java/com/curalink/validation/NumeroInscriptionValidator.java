package com.curalink.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class NumeroInscriptionValidator implements ConstraintValidator<NumeroInscription, String> {

	private static final int MIN_LENGTH = 8;
	private static final int MAX_LENGTH = 30;

	private static final Pattern FORMAT =
			Pattern.compile("^[A-Z0-9]{2,10}(-[A-Z0-9]{2,10}){1,3}$");

	public static String normalize(String value) {
		if (value == null) {
			return null;
		}
		return value.trim().toUpperCase();
	}

	static boolean isWellFormed(String value) {
		if (value == null || value.isBlank()) {
			return false;
		}
		String normalized = normalize(value);
		if (normalized.length() < MIN_LENGTH || normalized.length() > MAX_LENGTH) {
			return false;
		}
		return FORMAT.matcher(normalized).matches();
	}

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null || value.isBlank()) {
			return true;
		}
		return isWellFormed(value);
	}
}
