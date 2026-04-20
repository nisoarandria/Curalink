package com.curalink.model.user;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ADMIN")
public class Admin extends User {

	public Admin() {
	}

	public Admin(String nom, String prenom, String email, String telephone, String adresse, String photoProfile) {
		super(nom, prenom, email, telephone, adresse, photoProfile, null);
	}
}
