package com.curalink.model.nutrition;

import com.curalink.model.user.Nutritionniste;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "article")
public class Article {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String titre;

	@Column(nullable = false, columnDefinition = "text")
	private String contenu;

	@Column(name = "date_publication", nullable = false)
	private LocalDateTime datePublication;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "rubrique_id", nullable = false)
	private RubriqueNutritionnelle rubrique;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "auteur_id", nullable = false)
	private Nutritionniste auteur;

	protected Article() {
	}

	public Article(
			String titre,
			String contenu,
			LocalDateTime datePublication,
			RubriqueNutritionnelle rubrique,
			Nutritionniste auteur) {
		this.titre = titre;
		this.contenu = contenu;
		this.datePublication = datePublication;
		this.rubrique = rubrique;
		this.auteur = auteur;
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

	public String getContenu() {
		return contenu;
	}

	public void setContenu(String contenu) {
		this.contenu = contenu;
	}

	public LocalDateTime getDatePublication() {
		return datePublication;
	}

	public void setDatePublication(LocalDateTime datePublication) {
		this.datePublication = datePublication;
	}

	public RubriqueNutritionnelle getRubrique() {
		return rubrique;
	}

	public void setRubrique(RubriqueNutritionnelle rubrique) {
		this.rubrique = rubrique;
	}

	public Nutritionniste getAuteur() {
		return auteur;
	}

	public void setAuteur(Nutritionniste auteur) {
		this.auteur = auteur;
	}
}
