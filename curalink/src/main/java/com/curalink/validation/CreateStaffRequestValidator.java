package com.curalink.validation;

import com.curalink.api.admin.dto.CreateStaffRequest;
import com.curalink.api.admin.dto.StaffRole;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CreateStaffRequestValidator implements ConstraintValidator<ValidCreateStaffRequest, CreateStaffRequest> {

	@Override
	public boolean isValid(CreateStaffRequest request, ConstraintValidatorContext context) {
		if (request == null || request.role() != StaffRole.MEDECIN) {
			return true;
		}

		context.disableDefaultConstraintViolation();
		boolean valid = true;

		if (request.numeroInscription() == null || request.numeroInscription().isBlank()) {
			context.buildConstraintViolationWithTemplate(
					"Le champ numeroInscription est obligatoire pour la création d’un médecin")
					.addPropertyNode("numeroInscription")
					.addConstraintViolation();
			valid = false;
		} else if (!NumeroInscriptionValidator.isWellFormed(request.numeroInscription())) {
			context.buildConstraintViolationWithTemplate(
					"Numéro d'inscription invalide (ex. ORD-MED-001, 8 à 30 caractères alphanumériques et tirets)")
					.addPropertyNode("numeroInscription")
					.addConstraintViolation();
			valid = false;
		}

		return valid;
	}
}
