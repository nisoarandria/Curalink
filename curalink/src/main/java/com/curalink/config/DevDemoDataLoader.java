package com.curalink.config;

import com.curalink.model.catalog.ServiceItem;
import com.curalink.model.nutrition.Article;
import com.curalink.model.nutrition.RubriqueNutritionnelle;
import com.curalink.model.consultation.AntecedentMedical;
import com.curalink.model.consultation.Consultation;
import com.curalink.model.consultation.ConstanteVitale;
import com.curalink.model.rendezvous.RendezVous;
import com.curalink.model.rendezvous.RendezVousStatus;
import com.curalink.model.user.Admin;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Nutritionniste;
import com.curalink.model.user.Patient;
import com.curalink.model.user.Sexe;
import com.curalink.model.user.User;
import com.curalink.repository.AntecedentMedicalRepository;
import com.curalink.repository.ArticleRepository;
import com.curalink.repository.ConsultationRepository;
import com.curalink.repository.ConstanteVitaleRepository;
import com.curalink.repository.RendezVousRepository;
import com.curalink.repository.RubriqueNutritionnelleRepository;
import com.curalink.repository.ServiceItemRepository;
import com.curalink.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@Profile("dev")
@Order(30)
public class DevDemoDataLoader implements ApplicationRunner {

	private final ServiceItemRepository serviceItemRepository;
	private final UserRepository userRepository;
	private final RendezVousRepository rendezVousRepository;
	private final ConsultationRepository consultationRepository;
	private final ConstanteVitaleRepository constanteVitaleRepository;
	private final AntecedentMedicalRepository antecedentMedicalRepository;
	private final RubriqueNutritionnelleRepository rubriqueNutritionnelleRepository;
	private final ArticleRepository articleRepository;
	private final PasswordEncoder passwordEncoder;

	public DevDemoDataLoader(
			ServiceItemRepository serviceItemRepository,
			UserRepository userRepository,
			RendezVousRepository rendezVousRepository,
			ConsultationRepository consultationRepository,
			ConstanteVitaleRepository constanteVitaleRepository,
			AntecedentMedicalRepository antecedentMedicalRepository,
			RubriqueNutritionnelleRepository rubriqueNutritionnelleRepository,
			ArticleRepository articleRepository,
			PasswordEncoder passwordEncoder) {
		this.serviceItemRepository = serviceItemRepository;
		this.userRepository = userRepository;
		this.rendezVousRepository = rendezVousRepository;
		this.consultationRepository = consultationRepository;
		this.constanteVitaleRepository = constanteVitaleRepository;
		this.antecedentMedicalRepository = antecedentMedicalRepository;
		this.rubriqueNutritionnelleRepository = rubriqueNutritionnelleRepository;
		this.articleRepository = articleRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		Map<String, ServiceItem> services = ensureServices();

		Admin admin = ensureAdmin();
		Patient patientA = ensurePatient(
				"patient.alpha@yopmail.com",
				"Rakoto",
				"Mia",
				"+261340000001",
				"Antananarivo",
				"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
				LocalDate.of(1996, 5, 12),
				Sexe.FEMININ);
		Patient patientB = ensurePatient(
				"patient.beta@yopmail.com",
				"Randria",
				"Lova",
				"+261340000002",
				"Fianarantsoa",
				"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
				LocalDate.of(1989, 11, 3),
				Sexe.MASCULIN);

		Medecin medecinGeneraliste = ensureMedecin(
				"medecin.generaliste@yopmail.com",
				"Andria",
				"Noro",
				"+261340000003",
				"Antsirabe",
				"ORD-MED-001",
				"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80",
				services.get("MEDECINE_GENERALE"));
		Medecin medecinCardio = ensureMedecin(
				"medecin.cardio@yopmail.com",
				"Rabe",
				"Toky",
				"+261340000004",
				"Toamasina",
				"ORD-MED-002",
				"https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=800&q=80",
				services.get("CARDIOLOGIE"));

		Nutritionniste nutritionniste = ensureNutritionniste(
				"nutrition@yopmail.com",
				"Ravao",
				"Faniry",
				"+261340000005",
				"Mahajanga",
				"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80");

		ensureMedicalData(patientA, medecinGeneraliste, services.get("MEDECINE_GENERALE"));
		ensureMedicalData(patientB, medecinCardio, services.get("CARDIOLOGIE"));
		ensureNutritionArticles(nutritionniste);

		// Keep the local admin provisioned by env as-is, and ensure at least one yopmail admin too.
		if (admin.getPasswordHash() == null || admin.getPasswordHash().isBlank()) {
			admin.setPasswordHash(passwordEncoder.encode("Admin123!"));
			userRepository.save(admin);
		}
	}

	private Map<String, ServiceItem> ensureServices() {
		Map<String, ServiceItem> byName = new HashMap<>();
		for (ServiceItem service : serviceItemRepository.findAll()) {
			byName.put(normalizeServiceName(service.getNom()), service);
		}

		ServiceItem medecine = byName.computeIfAbsent("MEDECINE_GENERALE", key -> serviceItemRepository.save(
				new ServiceItem(
						"Médecine générale",
						"Consultations de première intention, suivi global adulte/enfant et orientation vers spécialistes.",
						"https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80")));

		ServiceItem cardio = byName.computeIfAbsent("CARDIOLOGIE", key -> serviceItemRepository.save(
				new ServiceItem(
						"Cardiologie",
						"Prévention cardiovasculaire, bilan tensionnel, lecture ECG et suivi de l’hypertension.",
						"https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80")));

		ServiceItem nutrition = byName.computeIfAbsent("NUTRITION", key -> serviceItemRepository.save(
				new ServiceItem(
						"Nutrition clinique",
						"Plans alimentaires personnalisés, éducation nutritionnelle et suivi métabolique.",
						"https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80")));

		Map<String, ServiceItem> result = new HashMap<>();
		result.put("MEDECINE_GENERALE", medecine);
		result.put("CARDIOLOGIE", cardio);
		result.put("NUTRITION", nutrition);
		return result;
	}

	private Admin ensureAdmin() {
		String email = "admin.demo@yopmail.com";
		User existing = userRepository.findByEmail(email).orElse(null);
		if (existing instanceof Admin admin) {
			return admin;
		}
		Admin admin = new Admin(
				"ADMIN",
				"DEMO",
				email,
				"+261340000000",
				"Antananarivo",
				"https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=800&q=80");
		admin.setPasswordHash(passwordEncoder.encode("Admin123!"));
		return (Admin) userRepository.save(admin);
	}

	private Patient ensurePatient(
			String email,
			String nom,
			String prenom,
			String telephone,
			String adresse,
			String photoProfile,
			LocalDate naissance,
			Sexe sexe) {
		User existing = userRepository.findByEmail(email).orElse(null);
		if (existing instanceof Patient patient) {
			return patient;
		}
		Patient patient = new Patient(nom, prenom, email, telephone, adresse, photoProfile, naissance, sexe);
		patient.setPasswordHash(passwordEncoder.encode("Patient123!"));
		return (Patient) userRepository.save(patient);
	}

	private Medecin ensureMedecin(
			String email,
			String nom,
			String prenom,
			String telephone,
			String adresse,
			String numeroInscription,
			String photoProfile,
			ServiceItem service) {
		User existing = userRepository.findByEmail(email).orElse(null);
		if (existing instanceof Medecin medecin) {
			if (medecin.getService() == null && service != null) {
				medecin.setService(service);
				userRepository.save(medecin);
			}
			return medecin;
		}
		Medecin medecin = new Medecin(
				nom,
				prenom,
				email,
				telephone,
				adresse,
				numeroInscription,
				photoProfile,
				service);
		medecin.setPasswordHash(passwordEncoder.encode("Medecin123!"));
		return (Medecin) userRepository.save(medecin);
	}

	private Nutritionniste ensureNutritionniste(
			String email,
			String nom,
			String prenom,
			String telephone,
			String adresse,
			String photoProfile) {
		User existing = userRepository.findByEmail(email).orElse(null);
		if (existing instanceof Nutritionniste nutritionniste) {
			return nutritionniste;
		}
		Nutritionniste nutritionniste = new Nutritionniste(nom, prenom, email, telephone, adresse, photoProfile);
		nutritionniste.setPasswordHash(passwordEncoder.encode("Nutrition123!"));
		return (Nutritionniste) userRepository.save(nutritionniste);
	}

	private void ensureMedicalData(Patient patient, Medecin medecin, ServiceItem service) {
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime past = now.minusDays(7);
		LocalDateTime next = now.plusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0);

		boolean hasAnyForPatient = rendezVousRepository.findAll().stream()
				.anyMatch(rv -> rv.getPatient().getId().equals(patient.getId()));

		if (!hasAnyForPatient) {
			RendezVous rvTermine = new RendezVous(
					past,
					service,
					patient,
					medecin,
					RendezVousStatus.TERMINE);
			RendezVous rvConfirme = new RendezVous(
					next,
					service,
					patient,
					medecin,
					RendezVousStatus.CONFIRME);
			rendezVousRepository.saveAll(List.of(rvTermine, rvConfirme));

			consultationRepository.save(new Consultation(
					rvTermine,
					patient,
					medecin,
					"Fatigue persistante et céphalées modérées.",
					"Hygiène de vie à optimiser, bilan sanguin prescrit, suivi dans 2 semaines.",
					past.toLocalDate()));
		}

		if (constanteVitaleRepository.findByPatientIdOrderByDateDescIdDesc(patient.getId()).isEmpty()) {
			constanteVitaleRepository.saveAll(List.of(
					new ConstanteVitale(
							patient,
							LocalDate.now().minusDays(14),
							new BigDecimal("1.04"),
							"12/8",
							new BigDecimal("68.4"),
							new BigDecimal("22.4")),
					new ConstanteVitale(
							patient,
							LocalDate.now().minusDays(3),
							new BigDecimal("1.10"),
							"13/8",
							new BigDecimal("68.9"),
							new BigDecimal("22.6"))));
		}

		if (antecedentMedicalRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).isEmpty()) {
			antecedentMedicalRepository.saveAll(List.of(
					new AntecedentMedical(
							patient,
							"Antécédent familial d’hypertension artérielle.",
							LocalDateTime.now().minusMonths(6)),
					new AntecedentMedical(
							patient,
							"Épisode de gastrite traité en ambulatoire en 2024.",
							LocalDateTime.now().minusMonths(2))));
		}
	}

	private static String normalizeServiceName(String nom) {
		if (nom == null) {
			return "";
		}
		String n = nom.trim().toUpperCase(Locale.ROOT);
		return switch (n) {
			case "MEDECINE GENERALE", "MÉDECINE GÉNÉRALE" -> "MEDECINE_GENERALE";
			case "CARDIOLOGIE" -> "CARDIOLOGIE";
			case "NUTRITION", "NUTRITION CLINIQUE" -> "NUTRITION";
			default -> n.replace(' ', '_');
		};
	}

	private void ensureNutritionArticles(Nutritionniste auteur) {
		Map<String, RubriqueNutritionnelle> rubriques = new HashMap<>();
		for (RubriqueNutritionnelle r : rubriqueNutritionnelleRepository.findAll()) {
			rubriques.put(r.getPathologie(), r);
		}

		seedArticleIfAbsent(
				"Diabète : exemple de menu sur 24h",
				"""
						<h2>Objectif</h2>
						<p>Stabiliser la glycémie avec des repas simples et réguliers.</p>
						<h3>Petit-déjeuner</h3>
						<ul><li>Flocons d’avoine + yaourt nature</li><li>1 pomme</li></ul>
						<h3>Déjeuner</h3>
						<ul><li>Riz complet (portion modérée)</li><li>Poulet grillé</li><li>Légumes vapeur</li></ul>
						<h3>Dîner</h3>
						<ul><li>Soupe de légumes</li><li>Poisson au four</li><li>Salade verte</li></ul>
						<p><strong>Astuce :</strong> privilégier l’eau et éviter les boissons sucrées.</p>
						""",
				"https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80",
				rubriques.get("DIABETE"),
				auteur,
				LocalDateTime.now().minusDays(9));

		seedArticleIfAbsent(
				"Hypertension : réduire le sel sans perdre le goût",
				"""
						<h2>Pourquoi limiter le sel ?</h2>
						<p>Un excès de sodium favorise l’élévation de la pression artérielle.</p>
						<h3>Bonnes pratiques</h3>
						<ol>
						  <li>Goûter avant de saler.</li>
						  <li>Utiliser des herbes (thym, basilic, ail, gingembre).</li>
						  <li>Éviter les produits très transformés.</li>
						</ol>
						<p>Prioriser fruits, légumes et aliments riches en potassium.</p>
						""",
				"https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1200&q=80",
				rubriques.get("HYPERTENSION"),
				auteur,
				LocalDateTime.now().minusDays(7));

		seedArticleIfAbsent(
				"Cancer : nutrition de soutien pendant les traitements",
				"""
						<h2>Principes clés</h2>
						<ul>
						  <li>Fractionner les repas si l’appétit diminue.</li>
						  <li>Maintenir une bonne hydratation.</li>
						  <li>Adapter les textures en cas de mucite.</li>
						</ul>
						<p>Un suivi individualisé avec un professionnel reste indispensable.</p>
						""",
				"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
				rubriques.get("CANCER"),
				auteur,
				LocalDateTime.now().minusDays(5));

		seedArticleIfAbsent(
				"Grossesse : repères nutritionnels par trimestre",
				"""
						<h2>1er trimestre</h2>
						<p>Fractionner pour limiter les nausées, viser des aliments bien tolérés.</p>
						<h2>2e trimestre</h2>
						<p>Augmenter légèrement les apports, surveiller le fer et le calcium.</p>
						<h2>3e trimestre</h2>
						<p>Conserver des repas équilibrés et une hydratation régulière.</p>
						""",
				"https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=1200&q=80",
				rubriques.get("GROSSESSE"),
				auteur,
				LocalDateTime.now().minusDays(3));
	}

	private void seedArticleIfAbsent(
			String titre,
			String contenuHtml,
			String couvertureUrl,
			RubriqueNutritionnelle rubrique,
			Nutritionniste auteur,
			LocalDateTime datePublication) {
		if (rubrique == null || auteur == null) {
			return;
		}
		boolean exists = articleRepository.findAll().stream()
				.anyMatch(a -> titre.equalsIgnoreCase(a.getTitre()));
		if (exists) {
			return;
		}
		Article article = new Article(
				titre,
				contenuHtml,
				datePublication,
				couvertureUrl,
				rubrique,
				auteur);
		articleRepository.save(article);
	}
}
