package com.curalink.repository;

import com.curalink.model.consultation.Ordonnance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
	Optional<Ordonnance> findByConsultationId(Long consultationId);

	@Query("""
			select o from Ordonnance o
			join fetch o.consultation c
			join fetch c.patient p
			join fetch c.medecin m
			where p.id = :patientId
			order by o.createdAt desc
			""")
	List<Ordonnance> findAllByPatientId(@Param("patientId") Long patientId);

	@Query("""
			select o from Ordonnance o
			join fetch o.consultation c
			join fetch c.patient p
			join fetch c.medecin m
			where p.id = :patientId and c.date = :date
			order by o.createdAt desc
			""")
	List<Ordonnance> findAllByPatientIdAndConsultationDate(@Param("patientId") Long patientId, @Param("date") LocalDate date);

	@Query("""
			select o from Ordonnance o
			join fetch o.consultation c
			join fetch c.patient p
			where o.id = :ordonnanceId and p.id = :patientId
			""")
	Optional<Ordonnance> findByIdAndPatientId(@Param("ordonnanceId") Long ordonnanceId, @Param("patientId") Long patientId);
}
