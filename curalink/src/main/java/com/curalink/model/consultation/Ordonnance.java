package com.curalink.model.consultation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "ordonnance")
public class Ordonnance {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "consultation_id", nullable = false, unique = true)
	private Consultation consultation;

	@Column(nullable = false, columnDefinition = "text")
	private String prescription;

	@Lob
	@Column(name = "pdf_content", nullable = false)
	private byte[] pdfContent;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	protected Ordonnance() {
	}

	public Ordonnance(Consultation consultation, String prescription, byte[] pdfContent, LocalDateTime createdAt) {
		this.consultation = consultation;
		this.prescription = prescription;
		this.pdfContent = pdfContent;
		this.createdAt = createdAt;
	}

	public Long getId() {
		return id;
	}

	public Consultation getConsultation() {
		return consultation;
	}

	public String getPrescription() {
		return prescription;
	}

	public byte[] getPdfContent() {
		return pdfContent;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
