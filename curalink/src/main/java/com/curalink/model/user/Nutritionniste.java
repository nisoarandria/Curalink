package com.curalink.model.user;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("NUTRITIONNISTE")
public class Nutritionniste extends User {

	public Nutritionniste() {
	}

	public Nutritionniste(String nom, String prenom, String email, String telephone, String adresse, String photoProfile) {
		super(nom, prenom, email, telephone, adresse, photoProfile, null);
	}
}
