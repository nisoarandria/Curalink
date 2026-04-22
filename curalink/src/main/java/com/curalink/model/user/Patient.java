package com.curalink.model.user;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.LocalDate;

@Entity
@DiscriminatorValue("PATIENT")
public class Patient extends User {

	@Column(name = "date_naissance")
	private LocalDate dateNaissance;

	@Enumerated(EnumType.STRING)
	private Sexe sexe;

	public Patient() {
	}

	public Patient(String nom, String prenom, String email, String telephone, String adresse, String photoProfile,
			LocalDate dateNaissance, Sexe sexe) {
		super(nom, prenom, email, telephone, adresse, photoProfile, null);
		this.dateNaissance = dateNaissance;
		this.sexe = sexe;
	}

	public LocalDate getDateNaissance() {
		return dateNaissance;
	}

	public void setDateNaissance(LocalDate dateNaissance) {
		this.dateNaissance = dateNaissance;
	}

	public Sexe getSexe() {
		return sexe;
	}

	public void setSexe(Sexe sexe) {
		this.sexe = sexe;
	}
}
