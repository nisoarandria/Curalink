package com.curalink.model.catalog;

import com.curalink.model.user.Medecin;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_item")
public class ServiceItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String nom;

	@Column(columnDefinition = "text")
	private String description;

	/** Nom du fichier sur disque (ex. uuid.png), sous le répertoire configuré. */
	@Column(name = "illustration_file", nullable = false)
	private String illustrationFile;

	@OneToMany(mappedBy = "service")
	private List<Medecin> medecins = new ArrayList<>();

	protected ServiceItem() {
	}

	public ServiceItem(String nom, String description, String illustrationFile) {
		this.nom = nom;
		this.description = description;
		this.illustrationFile = illustrationFile;
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

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getIllustrationFile() {
		return illustrationFile;
	}

	public void setIllustrationFile(String illustrationFile) {
		this.illustrationFile = illustrationFile;
	}

	public List<Medecin> getMedecins() {
		return medecins;
	}
}
