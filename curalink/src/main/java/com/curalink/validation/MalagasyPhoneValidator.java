package com.curalink.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class MalagasyPhoneValidator implements ConstraintValidator<MalagasyPhone, String> {

	/** Mobile Madagascar : 0 + 9 chiffres ou +261 + 9 chiffres (préfixe opérateur 32–38). */
	private static final Pattern MALAGASY_MOBILE =
			Pattern.compile("^(?:0|\\+261)(3[2-8])\\d{7}$");

	public static String normalize(String value) {
		if (value == null) {
			return null;
		}
		return value.trim().replaceAll("\\s+", "");
	}

	static boolean isWellFormed(String value) {
		if (value == null || value.isBlank()) {
			return false;
		}
		return MALAGASY_MOBILE.matcher(normalize(value)).matches();
	}

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null || value.isBlank()) {
			return true;
		}
		return isWellFormed(value);
	}
}
