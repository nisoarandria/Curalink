package com.curalink.api.nutrition;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.nutrition.dto.ArticleByNutritionnisteResponse;
import com.curalink.api.nutrition.dto.RubriqueArticleCountResponse;
import com.curalink.api.nutrition.dto.RubriqueSummary;
import com.curalink.security.JwtService;
import com.curalink.service.nutrition.NutritionArticleService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NutritionArticleController.class)
@AutoConfigureMockMvc(addFilters = false)
class NutritionArticleControllerWebTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private NutritionArticleService nutritionArticleService;

	@MockitoBean
	private JwtService jwtService;

	@Test
	void shouldListRubriquesWithArticleCount() throws Exception {
		when(nutritionArticleService.listRubriquesWithArticleCount()).thenReturn(List.of(
				new RubriqueArticleCountResponse(1L, "Diabète", 4L),
				new RubriqueArticleCountResponse(2L, "Obésité", 2L)));
		var auth = new UsernamePasswordAuthenticationToken(
				"nutritionniste",
				null,
				Set.of(() -> "ROLE_NUTRITIONNISTE"));
		SecurityContextHolder.getContext().setAuthentication(auth);

		mockMvc.perform(get("/api/nutrition/rubriques/article-count")
						.accept(MediaType.APPLICATION_JSON))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].rubriqueId").value(1))
				.andExpect(jsonPath("$[0].nomRubrique").value("Diabète"))
				.andExpect(jsonPath("$[0].nombreArticles").value(4));
		SecurityContextHolder.clearContext();
	}

	@Test
	void shouldListArticlesByNutritionniste() throws Exception {
		var auth = new UsernamePasswordAuthenticationToken(
				"nutritionniste",
				null,
				Set.of(() -> "ROLE_NUTRITIONNISTE"));
		SecurityContextHolder.getContext().setAuthentication(auth);

		var rubrique = new RubriqueSummary(1L, "Diabète", "DIABETE", "Description rubrique");
		var oneArticle = new ArticleByNutritionnisteResponse(
				10L,
				"Titre",
				"<p>Contenu</p>",
				java.time.LocalDateTime.parse("2026-04-20T10:00:00"),
				null,
				rubrique,
				"Marie Dupont");
		when(nutritionArticleService.listArticlesByNutritionniste(eq(5L), eq(0), eq(20), isNull(), isNull(), isNull(), isNull()))
				.thenReturn(new PageResponse<>(List.of(oneArticle), 0, 20, 1, 1));

		mockMvc.perform(get("/api/nutrition/nutritionnistes/5/articles")
						.accept(MediaType.APPLICATION_JSON))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.content.length()").value(1))
				.andExpect(jsonPath("$.content[0].id").value(10))
				.andExpect(jsonPath("$.content[0].auteurNom").value("Marie Dupont"))
				.andExpect(jsonPath("$.totalElements").value(1));

		SecurityContextHolder.clearContext();
	}
}
