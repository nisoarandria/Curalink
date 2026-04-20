package com.curalink.security;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Restreint l’accès à un contrôleur ou une méthode.
 * <ul>
 * <li>Sans cette annotation : accès public (y compris sans JWT).</li>
 * <li>Avec {@link #value()} vide : tout utilisateur authentifié avec un JWT valide (profil patient, médecin ou nutritionniste).</li>
 * <li>Avec un ou plusieurs types : seuls ces profils sont autorisés (rôles {@code ROLE_PATIENT}, etc.).</li>
 * </ul>
 * L’annotation sur une méthode remplace celle du contrôleur pour cette méthode.
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE, ElementType.METHOD })
public @interface RequireUserTypes {

	/**
	 * Profils autorisés. Vide = tout utilisateur authentifié via Bearer (un des trois profils).
	 */
	UserType[] value() default {};
}
