package com.curalink.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = NumeroInscriptionValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface NumeroInscription {

	String message() default "Numéro d'inscription invalide (ex. ORD-MED-001, 8 à 30 caractères alphanumériques et tirets)";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
