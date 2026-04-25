package com.curalink.repository;

import com.curalink.model.rendezvous.RendezVous;
import com.curalink.model.rendezvous.RendezVousStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {

	@Query(
			value = """
					select r from RendezVous r
					join r.patient p
					join r.medecin m
					where m.id = :medecinId
					  and r.dateHeure >= :startDateTime
					  and r.dateHeure < :endDateTime
					  and (:q is null or
					       lower(p.nom) like lower(concat('%', :q, '%')) or
					       lower(p.prenom) like lower(concat('%', :q, '%')) or
					       lower(p.email) like lower(concat('%', :q, '%')))
					""",
			countQuery = """
					select count(r) from RendezVous r
					join r.patient p
					join r.medecin m
					where m.id = :medecinId
					  and r.dateHeure >= :startDateTime
					  and r.dateHeure < :endDateTime
					  and (:q is null or
					       lower(p.nom) like lower(concat('%', :q, '%')) or
					       lower(p.prenom) like lower(concat('%', :q, '%')) or
					       lower(p.email) like lower(concat('%', :q, '%')))
					""")
	Page<RendezVous> searchForMedecinByDate(
			@Param("medecinId") Long medecinId,
			@Param("startDateTime") LocalDateTime startDateTime,
			@Param("endDateTime") LocalDateTime endDateTime,
			@Param("q") String q,
			Pageable pageable);

	@Query(
			value = """
					select r from RendezVous r
					join r.patient p
					join r.medecin m
					where p.id = :patientId
					  and r.dateHeure >= :startDateTime
					  and r.dateHeure < :endDateTime
					  and (:q is null or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.email) like lower(concat('%', :q, '%')))
					""",
			countQuery = """
					select count(r) from RendezVous r
					join r.patient p
					join r.medecin m
					where p.id = :patientId
					  and r.dateHeure >= :startDateTime
					  and r.dateHeure < :endDateTime
					  and (:q is null or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.email) like lower(concat('%', :q, '%')))
					""")
	Page<RendezVous> searchForPatientByDate(
			@Param("patientId") Long patientId,
			@Param("startDateTime") LocalDateTime startDateTime,
			@Param("endDateTime") LocalDateTime endDateTime,
			@Param("q") String q,
			Pageable pageable);

	@Query(
			value = """
					select r from RendezVous r
					join r.patient p
					join r.medecin m
					where p.id = :patientId
					  and (:q = '' or
					       lower(cast(m.nom as string)) like lower(concat('%', :q, '%')) or
					       lower(cast(m.prenom as string)) like lower(concat('%', :q, '%')) or
					       lower(cast(m.email as string)) like lower(concat('%', :q, '%')))
					""",
			countQuery = """
					select count(r) from RendezVous r
					join r.patient p
					join r.medecin m
					where p.id = :patientId
					  and (:q = '' or
					       lower(cast(m.nom as string)) like lower(concat('%', :q, '%')) or
					       lower(cast(m.prenom as string)) like lower(concat('%', :q, '%')) or
					       lower(cast(m.email as string)) like lower(concat('%', :q, '%')))
					""")
	Page<RendezVous> searchForPatientNoDate(
			@Param("patientId") Long patientId,
			@Param("q") String q,
			Pageable pageable);

	@Query(
			value = """
					select r from RendezVous r
					join r.patient p
					join r.medecin m
					join r.service s
					where (:medecinId is null or m.id = :medecinId)
					  and (:q is null or
					       lower(p.nom) like lower(concat('%', :q, '%')) or
					       lower(p.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(s.nom) like lower(concat('%', :q, '%')))
					""",
			countQuery = """
					select count(r) from RendezVous r
					join r.patient p
					join r.medecin m
					join r.service s
					where (:medecinId is null or m.id = :medecinId)
					  and (:q is null or
					       lower(p.nom) like lower(concat('%', :q, '%')) or
					       lower(p.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(s.nom) like lower(concat('%', :q, '%')))
					""")
	Page<RendezVous> searchGlobalNoDate(
			@Param("medecinId") Long medecinId,
			@Param("q") String q,
			Pageable pageable);

	@Query(
			value = """
					select r from RendezVous r
					join r.patient p
					join r.medecin m
					join r.service s
					where (:medecinId is null or m.id = :medecinId)
					  and r.dateHeure >= :startDateTime
					  and r.dateHeure < :endDateTime
					  and (:q is null or
					       lower(p.nom) like lower(concat('%', :q, '%')) or
					       lower(p.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(s.nom) like lower(concat('%', :q, '%')))
					""",
			countQuery = """
					select count(r) from RendezVous r
					join r.patient p
					join r.medecin m
					join r.service s
					where (:medecinId is null or m.id = :medecinId)
					  and r.dateHeure >= :startDateTime
					  and r.dateHeure < :endDateTime
					  and (:q is null or
					       lower(p.nom) like lower(concat('%', :q, '%')) or
					       lower(p.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(s.nom) like lower(concat('%', :q, '%')))
					""")
	Page<RendezVous> searchGlobalByDate(
			@Param("medecinId") Long medecinId,
			@Param("startDateTime") LocalDateTime startDateTime,
			@Param("endDateTime") LocalDateTime endDateTime,
			@Param("q") String q,
			Pageable pageable);

	List<RendezVous> findTop5ByMedecin_IdAndStatusAndDateHeureBetweenOrderByDateHeureDesc(
			Long medecinId,
			RendezVousStatus status,
			LocalDateTime startDateTime,
			LocalDateTime endDateTime);

	List<RendezVous> findTop5ByMedecin_IdAndDateHeureGreaterThanEqualAndStatusNotInOrderByDateHeureAsc(
			Long medecinId,
			LocalDateTime dateHeure,
			Collection<RendezVousStatus> excludedStatuses);

	long countByStatus(RendezVousStatus status);
}
