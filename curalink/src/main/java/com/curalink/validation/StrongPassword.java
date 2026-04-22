package com.curalink.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {

	String message() default "Le mot de passe doit contenir au moins 8 caractères, au moins une majuscule, une minuscule, un chiffre, un caractère spécial, et ne pas contenir d'espaces";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
