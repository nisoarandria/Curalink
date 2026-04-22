package com.curalink.repository;

import com.curalink.model.disponibilite.Disponibilite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DisponibiliteRepository extends JpaRepository<Disponibilite, Long> {

	List<Disponibilite> findByMedecinIdOrderByDateDebutAscHeureDebutAsc(Long medecinId);

	Optional<Disponibilite> findByIdAndMedecinId(Long id, Long medecinId);

	@Query("""
			select d from Disponibilite d
			join fetch d.medecin m
			join fetch m.service s
			where m.id = :medecinId
			order by d.dateDebut asc, d.heureDebut asc
			""")
	List<Disponibilite> findByMedecinIdOrdered(@Param("medecinId") Long medecinId);

	@Query("""
			select d from Disponibilite d
			join fetch d.medecin m
			join fetch m.service s
			where s.id = :serviceId
			  and d.dateDebut <= :date
			  and d.dateFin >= :date
			order by d.heureDebut asc, m.nom asc, m.prenom asc
			""")
	List<Disponibilite> findByServiceAndDateOrdered(@Param("serviceId") Long serviceId, @Param("date") LocalDate date);

	@Query("""
			select d from Disponibilite d
			where d.medecin.id = :medecinId
			  and d.dateDebut <= :dateFin
			  and d.dateFin >= :dateDebut
			""")
	List<Disponibilite> findPotentialConflicts(
			@Param("medecinId") Long medecinId,
			@Param("dateDebut") LocalDate dateDebut,
			@Param("dateFin") LocalDate dateFin);

	@Query(
			value = """
					select d from Disponibilite d
					join d.medecin m
					where (:medecinId is null or m.id = :medecinId)
					  and (:date is null or (d.dateDebut <= :date and d.dateFin >= :date))
					  and (:q is null or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.email) like lower(concat('%', :q, '%')))
					""",
			countQuery = """
					select count(d) from Disponibilite d
					join d.medecin m
					where (:medecinId is null or m.id = :medecinId)
					  and (:date is null or (d.dateDebut <= :date and d.dateFin >= :date))
					  and (:q is null or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.email) like lower(concat('%', :q, '%')))
					""")
	Page<Disponibilite> searchAdmin(
			@Param("medecinId") Long medecinId,
			@Param("date") LocalDate date,
			@Param("q") String q,
			Pageable pageable);

	@Query(
			value = """
					select d from Disponibilite d
					join d.medecin m
					where (:medecinId is null or m.id = :medecinId)
					  and (:q is null or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.email) like lower(concat('%', :q, '%')))
					""",
			countQuery = """
					select count(d) from Disponibilite d
					join d.medecin m
					where (:medecinId is null or m.id = :medecinId)
					  and (:q is null or
					       lower(m.nom) like lower(concat('%', :q, '%')) or
					       lower(m.prenom) like lower(concat('%', :q, '%')) or
					       lower(m.email) like lower(concat('%', :q, '%')))
					""")
	Page<Disponibilite> searchAdminNoDate(
			@Param("medecinId") Long medecinId,
			@Param("q") String q,
			Pageable pageable);

	@Query("""
			select d from Disponibilite d
			join d.medecin m
			where (:medecinId is null or m.id = :medecinId)
			  and (:q is null or
			       lower(m.nom) like lower(concat('%', :q, '%')) or
			       lower(m.prenom) like lower(concat('%', :q, '%')) or
			       lower(m.email) like lower(concat('%', :q, '%')))
			order by d.dateDebut asc, d.heureDebut asc
			""")
	List<Disponibilite> searchAdminNoDateList(
			@Param("medecinId") Long medecinId,
			@Param("q") String q);

	@Modifying
	@Query("""
			update Disponibilite d
			set d.planningValide = true
			where d.medecin.id = :medecinId
			""")
	int validateAllByMedecin(@Param("medecinId") Long medecinId);
}
