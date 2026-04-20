package com.curalink.service.nutrition;

import com.curalink.api.nutrition.dto.ArticleCreateRequest;
import com.curalink.api.nutrition.dto.ArticleResponse;
import com.curalink.model.nutrition.Article;
import com.curalink.model.nutrition.RubriqueNutritionnelle;
import com.curalink.model.user.Nutritionniste;
import com.curalink.repository.ArticleRepository;
import com.curalink.repository.RubriqueNutritionnelleRepository;
import com.curalink.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class NutritionArticleServiceIntegrationTest {

	private static final long OBESITE_RUBRIQUE_ID = 6L;

	private final NutritionArticleService nutritionArticleService;
	@Autowired
	private RubriqueNutritionnelleRepository rubriqueRepository;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ArticleRepository articleRepository;

	@Autowired
	NutritionArticleServiceIntegrationTest(NutritionArticleService nutritionArticleService) {
		this.nutritionArticleService = nutritionArticleService;
	}

	@Test
	void createArticleHtmlForObesiteRubriqueId6() {
		RubriqueNutritionnelle rubrique = rubriqueRepository.findById(OBESITE_RUBRIQUE_ID)
				.orElseThrow(() -> new AssertionError("La rubrique id=6 (Obesite) doit exister pour ce test"));
		assertEquals("OBESITE", rubrique.getPathologie());

		Nutritionniste auteur = userRepository.save(new Nutritionniste(
				"Test",
				"Nutrition",
				"nutrition.test+" + System.nanoTime() + "@curalink.local",
				"+261340000000",
				"Antananarivo",
				null));

		String contenuHtml = """
				<h1>Obesite : plan alimentaire progressif</h1>
				<p>Objectif : reduire l'apport calorique sans frustration majeure.</p>
				<ul>
				  <li>Prioriser les legumes a chaque repas.</li>
				  <li>Remplacer les boissons sucrees par de l'eau.</li>
				  <li>Fractionner les collations si faim importante.</li>
				</ul>
				<p><strong>Suivi :</strong> evaluer le poids et le tour de taille toutes les 2 semaines.</p>
				""";

		ArticleCreateRequest request = new ArticleCreateRequest(
				"Obesite - Reequilibrage nutritionnel",
				contenuHtml,
				OBESITE_RUBRIQUE_ID,
				LocalDateTime.of(2026, 4, 20, 9, 0));

		ArticleResponse created = nutritionArticleService.createArticle(request, auteur.getId());

		assertNotNull(created.id());
		assertEquals(OBESITE_RUBRIQUE_ID, created.rubrique().id());
		assertEquals("OBESITE", created.rubrique().pathologie());
		assertTrue(created.contenu().contains("<h1>Obesite : plan alimentaire progressif</h1>"));
		assertTrue(created.contenu().contains("<ul>"));

		Article persisted = articleRepository.findById(created.id())
				.orElseThrow(() -> new AssertionError("Article cree introuvable en base"));
		assertEquals(OBESITE_RUBRIQUE_ID, persisted.getRubrique().getId());
		assertEquals(contenuHtml.trim(), persisted.getContenu());
	}
}
