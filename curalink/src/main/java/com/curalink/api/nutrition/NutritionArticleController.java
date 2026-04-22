package com.curalink.api.nutrition;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.nutrition.dto.ArticleCreateRequest;
import com.curalink.api.nutrition.dto.ArticleResponse;
import com.curalink.api.nutrition.dto.ArticleUpdateRequest;
import com.curalink.api.nutrition.dto.RubriqueResponse;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.nutrition.NutritionArticleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/nutrition")
@RequireUserTypes(UserType.NUTRITIONNISTE)
public class NutritionArticleController {

	private final NutritionArticleService nutritionArticleService;

	public NutritionArticleController(NutritionArticleService nutritionArticleService) {
		this.nutritionArticleService = nutritionArticleService;
	}

	/** Pathologies / rubriques de référence (titres et descriptions). */
	@GetMapping("/rubriques")
	public ResponseEntity<List<RubriqueResponse>> listRubriques() {
		return ResponseEntity.ok(nutritionArticleService.listRubriques());
	}

	/**
	 * Liste paginée : recherche par titre ({@code q}), filtre par code pathologie (ex. DIABETE),
	 * plage de dates sur la date de publication (inclusif).
	 */
	@GetMapping("/articles")
	public ResponseEntity<PageResponse<ArticleResponse>> listArticles(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) String pathologie,
			@RequestParam(required = false) LocalDate dateDebut,
			@RequestParam(required = false) LocalDate dateFin) {
		return ResponseEntity.ok(
				nutritionArticleService.listArticles(page, size, q, pathologie, dateDebut, dateFin));
	}

	@GetMapping("/articles/{id}")
	public ResponseEntity<ArticleResponse> getArticle(@PathVariable long id) {
		return ResponseEntity.ok(nutritionArticleService.getArticle(id));
	}

	@PostMapping("/articles")
	public ResponseEntity<ArticleResponse> createArticle(
			@Valid @RequestBody ArticleCreateRequest request,
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(nutritionArticleService.createArticle(request, currentUser.userId()));
	}

	@PutMapping("/articles/{id}")
	public ResponseEntity<ArticleResponse> updateArticle(
			@PathVariable long id,
			@Valid @RequestBody ArticleUpdateRequest request,
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		return ResponseEntity.ok(nutritionArticleService.updateArticle(id, request, currentUser.userId()));
	}

	@DeleteMapping("/articles/{id}")
	public ResponseEntity<Void> deleteArticle(
			@PathVariable long id,
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		nutritionArticleService.deleteArticle(id, currentUser.userId());
		return ResponseEntity.noContent().build();
	}
}
