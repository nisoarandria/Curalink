package com.curalink.model.disponibilite;

import com.curalink.model.user.Medecin;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Convert;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.Set;

@Entity
@Table(name = "disponibilite")
public class Disponibilite {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "medecin_id", nullable = false)
	private Medecin medecin;

	@Column(name = "date_debut", nullable = false)
	private LocalDate dateDebut;

	/**
	 * Colonne legacy conservée pour compatibilité avec les bases déjà créées avant la migration vers
	 * date_debut/date_fin. Renseignée avec dateDebut.
	 */
	@Column(name = "date", nullable = false)
	private LocalDate legacyDate;

	@Column(name = "date_fin", nullable = false)
	private LocalDate dateFin;

	@Convert(converter = JoursSemaineJsonConverter.class)
	@Column(name = "jours_semaine", nullable = false, columnDefinition = "text")
	private Set<JourSemaine> joursSemaine = EnumSet.noneOf(JourSemaine.class);

	@Column(name = "heure_debut", nullable = false)
	private LocalTime heureDebut;

	@Column(name = "heure_fin", nullable = false)
	private LocalTime heureFin;

	@Column(name = "planning_valide", nullable = false)
	@ColumnDefault("false")
	private boolean planningValide;

	protected Disponibilite() {
	}

	public Disponibilite(
			Medecin medecin,
			LocalDate dateDebut,
			LocalDate dateFin,
			Set<JourSemaine> joursSemaine,
			LocalTime heureDebut,
			LocalTime heureFin) {
		this.medecin = medecin;
		this.dateDebut = dateDebut;
		this.legacyDate = dateDebut;
		this.dateFin = dateFin;
		this.joursSemaine = joursSemaine;
		this.heureDebut = heureDebut;
		this.heureFin = heureFin;
		this.planningValide = false;
	}

	public Long getId() {
		return id;
	}

	public Medecin getMedecin() {
		return medecin;
	}

	public LocalDate getDateDebut() {
		return dateDebut;
	}

	public void setDateDebut(LocalDate dateDebut) {
		this.dateDebut = dateDebut;
		this.legacyDate = dateDebut;
	}

	public LocalDate getDateFin() {
		return dateFin;
	}

	public void setDateFin(LocalDate dateFin) {
		this.dateFin = dateFin;
	}

	public Set<JourSemaine> getJoursSemaine() {
		return joursSemaine;
	}

	public void setJoursSemaine(Set<JourSemaine> joursSemaine) {
		this.joursSemaine = joursSemaine;
	}

	public LocalTime getHeureDebut() {
		return heureDebut;
	}

	public void setHeureDebut(LocalTime heureDebut) {
		this.heureDebut = heureDebut;
	}

	public LocalTime getHeureFin() {
		return heureFin;
	}

	public void setHeureFin(LocalTime heureFin) {
		this.heureFin = heureFin;
	}

	public boolean isPlanningValide() {
		return planningValide;
	}

	public void setPlanningValide(boolean planningValide) {
		this.planningValide = planningValide;
	}
}
