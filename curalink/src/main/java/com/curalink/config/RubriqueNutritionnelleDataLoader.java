package com.curalink.config;

import com.curalink.model.nutrition.RubriqueNutritionnelle;
import com.curalink.repository.RubriqueNutritionnelleRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Insère les rubriques / pathologies de référence si la table est vide.
 */
@Component
@Order(1)
public class RubriqueNutritionnelleDataLoader implements ApplicationRunner {

	private final RubriqueNutritionnelleRepository rubriqueRepository;

	public RubriqueNutritionnelleDataLoader(RubriqueNutritionnelleRepository rubriqueRepository) {
		this.rubriqueRepository = rubriqueRepository;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (rubriqueRepository.count() > 0) {
			return;
		}
		List<RubriqueNutritionnelle> seeds = List.of(
				new RubriqueNutritionnelle(
						"Diabète",
						"Rubrique dédiée à l’équilibrage glycémique, aux index glycémiques et à l’adaptation alimentaire au quotidien pour les personnes vivant avec un diabète.",
						"DIABETE"),
				new RubriqueNutritionnelle(
						"Hypertension",
						"Conseils sur la réduction du sel, l’apport en potassium et la prévention cardio-vasculaire par une alimentation adaptée.",
						"HYPERTENSION"),
				new RubriqueNutritionnelle(
						"Cancer",
						"Informations sur la nutrition de soutien avant, pendant et après les traitements, selon les tolérances et les recommandations médicales.",
						"CANCER"),
				new RubriqueNutritionnelle(
						"Ostéoporose",
						"Aliments riches en calcium et vitamine D, exposition solaire raisonnable et habitudes favorisant la santé osseuse.",
						"OSTEOPOROSE"),
				new RubriqueNutritionnelle(
						"Anémie",
						"Sources de fer héminique et non héminique, vitamine B12, vitamine C pour l’absorption et exemples de menus.",
						"ANEMIE"),
				new RubriqueNutritionnelle(
						"Obésité",
						"Rééquilibration énergétique durable, satiété, qualité des aliments et accompagnement comportemental.",
						"OBESITE"),
				new RubriqueNutritionnelle(
						"Grossesse",
						"Besoins nutritionnels par trimestre, compléments éventuels, aliments à privilégier et précautions d’hygiène alimentaire.",
						"GROSSESSE"));
		rubriqueRepository.saveAll(seeds);
	}
}
