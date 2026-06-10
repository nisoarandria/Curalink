package com.curalink.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = MalagasyPhoneValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface MalagasyPhone {

	String message() default "Numéro de téléphone malgache invalide (attendu : 0341234567 ou +261341234567)";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
