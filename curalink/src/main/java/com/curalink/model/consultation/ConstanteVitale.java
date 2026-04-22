package com.curalink.model.consultation;

import com.curalink.model.user.Patient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "constante_vitale")
public class ConstanteVitale {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "consultation_id", nullable = false)
	private Consultation consultation;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "patient_id", nullable = false)
	private Patient patient;

	@Column(nullable = false)
	private LocalDate date;

	private BigDecimal glycemie;
	private String tension;
	private BigDecimal poids;

	@Column(name = "imc")
	private BigDecimal imc;

	protected ConstanteVitale() {
	}

	public ConstanteVitale(Consultation consultation, Patient patient, LocalDate date, BigDecimal glycemie, String tension, BigDecimal poids, BigDecimal imc) {
		this.consultation = consultation;
		this.patient = patient;
		this.date = date;
		this.glycemie = glycemie;
		this.tension = tension;
		this.poids = poids;
		this.imc = imc;
	}

	public Long getId() {
		return id;
	}

	public Consultation getConsultation() {
		return consultation;
	}

	public Patient getPatient() {
		return patient;
	}

	public LocalDate getDate() {
		return date;
	}

	public BigDecimal getGlycemie() {
		return glycemie;
	}

	public String getTension() {
		return tension;
	}

	public BigDecimal getPoids() {
		return poids;
	}

	public BigDecimal getImc() {
		return imc;
	}
}
