package com.curalink.model.nutrition;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rubrique_nutritionnelle")
public class RubriqueNutritionnelle {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String titre;

	@Column(nullable = false, length = 4000)
	private String description;

	/** Code stable en majuscules (ex. DIABETE, HYPERTENSION). */
	@Column(nullable = false, unique = true, length = 64)
	private String pathologie;

	protected RubriqueNutritionnelle() {
	}

	public RubriqueNutritionnelle(String titre, String description, String pathologie) {
		this.titre = titre;
		this.description = description;
		this.pathologie = pathologie;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTitre() {
		return titre;
	}

	public void setTitre(String titre) {
		this.titre = titre;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getPathologie() {
		return pathologie;
	}

	public void setPathologie(String pathologie) {
		this.pathologie = pathologie;
	}
}
