package com.curalink.repository;

import com.curalink.model.user.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {

	boolean existsByEmail(String email);

	Optional<Patient> findByEmail(String email);

	/**
	 * Recherche sur nom, prénom, email, téléphone, adresse, photo, date de naissance (texte) et sexe.
	 */
	@Query(
			value = """
					SELECT * FROM users u
					WHERE u.user_type = 'PATIENT'
					AND (
						:q IS NULL
						OR LOWER(COALESCE(u.nom, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.prenom, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.telephone, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.adresse, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.photo_profile, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR CAST(u.date_naissance AS text) LIKE CONCAT('%', CAST(:q AS text), '%')
						OR LOWER(COALESCE(CAST(u.sexe AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
					)
					""",
			countQuery = """
					SELECT count(*) FROM users u
					WHERE u.user_type = 'PATIENT'
					AND (
						:q IS NULL
						OR LOWER(COALESCE(u.nom, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.prenom, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.telephone, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.adresse, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR LOWER(COALESCE(u.photo_profile, '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
						OR CAST(u.date_naissance AS text) LIKE CONCAT('%', CAST(:q AS text), '%')
						OR LOWER(COALESCE(CAST(u.sexe AS text), '')) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%'))
					)
					""",
			nativeQuery = true)
	Page<Patient> searchPatients(@Param("q") String q, Pageable pageable);
}
