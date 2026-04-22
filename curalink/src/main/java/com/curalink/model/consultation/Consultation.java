package com.curalink.model.consultation;

import com.curalink.model.rendezvous.RendezVous;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Patient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "consultation")
public class Consultation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "rendez_vous_id", nullable = false, unique = true)
	private RendezVous rendezVous;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "patient_id", nullable = false)
	private Patient patient;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "medecin_id", nullable = false)
	private Medecin medecin;

	@Column(nullable = false, columnDefinition = "text")
	private String motif;

	@Column(nullable = false, columnDefinition = "text")
	private String diagnostic;

	@Column(nullable = false)
	private LocalDate date;

	protected Consultation() {
	}

	public Consultation(RendezVous rendezVous, Patient patient, Medecin medecin, String motif, String diagnostic, LocalDate date) {
		this.rendezVous = rendezVous;
		this.patient = patient;
		this.medecin = medecin;
		this.motif = motif;
		this.diagnostic = diagnostic;
		this.date = date;
	}

	public Long getId() {
		return id;
	}

	public RendezVous getRendezVous() {
		return rendezVous;
	}

	public Patient getPatient() {
		return patient;
	}

	public Medecin getMedecin() {
		return medecin;
	}

	public String getMotif() {
		return motif;
	}

	public String getDiagnostic() {
		return diagnostic;
	}

	public LocalDate getDate() {
		return date;
	}
}
