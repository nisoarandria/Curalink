package com.curalink.model.user;

import com.curalink.model.catalog.ServiceItem;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
@DiscriminatorValue("MEDECIN")
public class Medecin extends User {

	/**
	 * Service du catalogue auquel le médecin est rattaché.
	 * Colonne partagée sur la table {@code users} : nullable pour les autres types de profil.
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "service_item_id")
	private ServiceItem service;

	@Column(name = "numero_inscription")
	private String numeroInscription;

	public Medecin() {
	}

	public Medecin(
			String nom,
			String prenom,
			String email,
			String telephone,
			String adresse,
			String numeroInscription,
			String photoProfile,
			ServiceItem service) {
		super(nom, prenom, email, telephone, adresse, photoProfile, null);
		this.service = service;
		this.numeroInscription = numeroInscription;
	}

	public ServiceItem getService() {
		return service;
	}

	public void setService(ServiceItem service) {
		this.service = service;
	}

	public String getNumeroInscription() {
		return numeroInscription;
	}

	public void setNumeroInscription(String numeroInscription) {
		this.numeroInscription = numeroInscription;
	}
}
