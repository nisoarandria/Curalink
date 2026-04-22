package com.curalink.model.rendezvous;

import com.curalink.model.catalog.ServiceItem;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Patient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "rendez_vous")
public class RendezVous {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "date_heure", nullable = false)
	private LocalDateTime dateHeure;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "service_item_id", nullable = false)
	private ServiceItem service;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "patient_id", nullable = false)
	private Patient patient;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "medecin_id", nullable = false)
	private Medecin medecin;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private RendezVousStatus status;

	protected RendezVous() {
	}

	public RendezVous(
			LocalDateTime dateHeure,
			ServiceItem service,
			Patient patient,
			Medecin medecin,
			RendezVousStatus status) {
		this.dateHeure = dateHeure;
		this.service = service;
		this.patient = patient;
		this.medecin = medecin;
		this.status = status;
	}

	public Long getId() {
		return id;
	}

	public LocalDateTime getDateHeure() {
		return dateHeure;
	}

	public void setDateHeure(LocalDateTime dateHeure) {
		this.dateHeure = dateHeure;
	}

	public ServiceItem getService() {
		return service;
	}

	public Patient getPatient() {
		return patient;
	}

	public Medecin getMedecin() {
		return medecin;
	}

	public RendezVousStatus getStatus() {
		return status;
	}

	public void setStatus(RendezVousStatus status) {
		this.status = status;
	}
}
