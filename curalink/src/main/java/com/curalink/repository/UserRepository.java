package com.curalink.repository;

import com.curalink.model.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	/**
	 * Médecins et nutritionnistes uniquement, avec filtre optionnel par type et recherche texte.
	 * Requête native : cast explicite en text pour éviter {@code lower(bytea)} si une colonne (ex. photo_profile) est bytea en base.
	 */
	@Query(
			value = """
					SELECT * FROM users u
					WHERE u.user_type IN ('MEDECIN', 'NUTRITIONNISTE')
					AND (
						:userType IS NULL
						OR (:userType = 'MEDECIN' AND u.user_type = 'MEDECIN')
						OR (:userType = 'NUTRITIONNISTE' AND u.user_type = 'NUTRITIONNISTE')
					)
					AND (
						:q IS NULL
						OR LOWER(COALESCE(CAST(u.nom AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.prenom AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.email AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.telephone AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.adresse AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.photo_profile AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
					)
					""",
			countQuery = """
					SELECT count(*) FROM users u
					WHERE u.user_type IN ('MEDECIN', 'NUTRITIONNISTE')
					AND (
						:userType IS NULL
						OR (:userType = 'MEDECIN' AND u.user_type = 'MEDECIN')
						OR (:userType = 'NUTRITIONNISTE' AND u.user_type = 'NUTRITIONNISTE')
					)
					AND (
						:q IS NULL
						OR LOWER(COALESCE(CAST(u.nom AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.prenom AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.email AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.telephone AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.adresse AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(CAST(u.photo_profile AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
					)
					""",
			nativeQuery = true)
	Page<User> searchStaff(@Param("q") String q, @Param("userType") String userType, Pageable pageable);
}
