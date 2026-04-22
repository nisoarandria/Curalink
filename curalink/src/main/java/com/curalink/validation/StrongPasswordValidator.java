package com.curalink.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

	private static final int MIN_LENGTH = 8;
	private static final int MAX_LENGTH = 128;

	private static final Pattern HAS_UPPER = Pattern.compile("[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŸ]");
	private static final Pattern HAS_LOWER = Pattern.compile("[a-zàâäéèêëïîôùûüçÿ]");
	private static final Pattern HAS_DIGIT = Pattern.compile("\\d");
	/** Caractères spéciaux usuels (clavier AZERTY/QWERTY) */
	private static final Pattern HAS_SPECIAL = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?`~]");

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null || value.isEmpty()) {
			return true;
		}

		if (value.length() < MIN_LENGTH || value.length() > MAX_LENGTH) {
			return false;
		}

		if (value.chars().anyMatch(Character::isWhitespace)) {
			return false;
		}

		return HAS_UPPER.matcher(value).find()
				&& HAS_LOWER.matcher(value).find()
				&& HAS_DIGIT.matcher(value).find()
				&& HAS_SPECIAL.matcher(value).find();
	}
}
