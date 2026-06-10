package com.curalink.model.notification;

import com.curalink.model.user.User;
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
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "recipient_id", nullable = false)
	private User recipient;

	@Column(name = "rendez_vous_id", nullable = false)
	private Long rendezVousId;

	@Column(nullable = false, length = 500)
	private String message;

	@Column(name = "date_heure", nullable = false)
	private LocalDateTime dateHeure;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private RendezVousNotificationLabel label;

	@Column(nullable = false)
	@ColumnDefault("false")
	private boolean lu;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	protected Notification() {
	}

	public Notification(
			User recipient,
			Long rendezVousId,
			String message,
			LocalDateTime dateHeure,
			RendezVousNotificationLabel label) {
		this.recipient = recipient;
		this.rendezVousId = rendezVousId;
		this.message = message;
		this.dateHeure = dateHeure;
		this.label = label;
		this.lu = false;
		this.createdAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public User getRecipient() {
		return recipient;
	}

	public Long getRendezVousId() {
		return rendezVousId;
	}

	public String getMessage() {
		return message;
	}

	public LocalDateTime getDateHeure() {
		return dateHeure;
	}

	public RendezVousNotificationLabel getLabel() {
		return label;
	}

	public boolean isLu() {
		return lu;
	}

	public void setLu(boolean lu) {
		this.lu = lu;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
