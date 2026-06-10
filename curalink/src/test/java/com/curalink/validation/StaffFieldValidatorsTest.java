package com.curalink.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StaffFieldValidatorsTest {

	@Test
	void acceptsMalagasyPhoneFormats() {
		assertTrue(MalagasyPhoneValidator.isWellFormed("0341234567"));
		assertTrue(MalagasyPhoneValidator.isWellFormed("+261341234567"));
		assertTrue(MalagasyPhoneValidator.isWellFormed("03 41 23 45 67"));
	}

	@Test
	void rejectsInvalidPhoneFormats() {
		assertFalse(MalagasyPhoneValidator.isWellFormed("123"));
		assertFalse(MalagasyPhoneValidator.isWellFormed("0141234567"));
		assertFalse(MalagasyPhoneValidator.isWellFormed("+33123456789"));
	}

	@Test
	void acceptsNumeroInscriptionFormats() {
		assertTrue(NumeroInscriptionValidator.isWellFormed("ORD-MED-001"));
		assertTrue(NumeroInscriptionValidator.isWellFormed("MG-12345"));
	}

	@Test
	void rejectsInvalidNumeroInscriptionFormats() {
		assertFalse(NumeroInscriptionValidator.isWellFormed("abc"));
		assertFalse(NumeroInscriptionValidator.isWellFormed("ORDMED001"));
		assertFalse(NumeroInscriptionValidator.isWellFormed("ORD-MED"));
	}

}
