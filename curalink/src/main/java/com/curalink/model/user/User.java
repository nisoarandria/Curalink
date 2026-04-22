package com.curalink.model.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "user_type", discriminatorType = DiscriminatorType.STRING)
@Table(name = "users")
public abstract class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String nom;

	@Column(nullable = false)
	private String prenom;

	@Column(nullable = false, unique = true)
	private String email;

	private String telephone;

	private String adresse;

	@Column(name = "photo_profile")
	private String photoProfile;

	@JsonIgnore
	@Column(name = "password_hash")
	private String passwordHash;

	/** Hash BCrypt du mot de passe temporaire envoyé par email (réinitialisation). */
	@JsonIgnore
	@Column(name = "password_reset_hash")
	private String passwordResetHash;

	@JsonIgnore
	@Column(name = "password_reset_expires_at")
	private LocalDateTime passwordResetExpiresAt;

	/**
	 * {@code true} tant que l’utilisateur n’a pas changé son mot de passe après la création par un admin (staff).
	 * {@code null} pour les lignes existantes avant migration (= considéré comme faux).
	 */
	@Column(name = "is_first_connexion")
	@ColumnDefault("false")
	private Boolean firstConnexion;

	protected User() {
	}

	protected User(String nom, String prenom, String email, String telephone, String adresse, String photoProfile,
			String passwordHash) {
		this.nom = nom;
		this.prenom = prenom;
		this.email = email;
		this.telephone = telephone;
		this.adresse = adresse;
		this.photoProfile = photoProfile;
		this.passwordHash = passwordHash;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getNom() {
		return nom;
	}

	public void setNom(String nom) {
		this.nom = nom;
	}

	public String getPrenom() {
		return prenom;
	}

	public void setPrenom(String prenom) {
		this.prenom = prenom;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getTelephone() {
		return telephone;
	}

	public void setTelephone(String telephone) {
		this.telephone = telephone;
	}

	public String getAdresse() {
		return adresse;
	}

	public void setAdresse(String adresse) {
		this.adresse = adresse;
	}

	public String getPhotoProfile() {
		return photoProfile;
	}

	public void setPhotoProfile(String photoProfile) {
		this.photoProfile = photoProfile;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public String getPasswordResetHash() {
		return passwordResetHash;
	}

	public void setPasswordResetHash(String passwordResetHash) {
		this.passwordResetHash = passwordResetHash;
	}

	public LocalDateTime getPasswordResetExpiresAt() {
		return passwordResetExpiresAt;
	}

	public void setPasswordResetExpiresAt(LocalDateTime passwordResetExpiresAt) {
		this.passwordResetExpiresAt = passwordResetExpiresAt;
	}

	public boolean isFirstConnexion() {
		return Boolean.TRUE.equals(firstConnexion);
	}

	public void setFirstConnexion(boolean firstConnexion) {
		this.firstConnexion = firstConnexion;
	}
}
