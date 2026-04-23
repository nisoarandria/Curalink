package com.curalink.api.nutrition;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.nutrition.dto.ArticleByNutritionnisteResponse;
import com.curalink.api.nutrition.dto.ArticleCreateRequest;
import com.curalink.api.nutrition.dto.ArticleListResponse;
import com.curalink.api.nutrition.dto.ArticleResponse;
import com.curalink.api.nutrition.dto.ArticleUpdateRequest;
import com.curalink.api.nutrition.dto.RubriqueArticleCountResponse;
import com.curalink.api.nutrition.dto.RubriqueResponse;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.nutrition.NutritionArticleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

	@GetMapping("/rubriques/article-count")
	public ResponseEntity<List<RubriqueArticleCountResponse>> listRubriquesWithArticleCount() {
		return ResponseEntity.ok(nutritionArticleService.listRubriquesWithArticleCount());
	}

	/**
	 * Liste paginée : recherche par titre ({@code q}), filtre par code pathologie (ex. DIABETE),
	 * plage de dates sur la date de publication (inclusif).
	 */
	@GetMapping("/articles")
	public ResponseEntity<ArticleListResponse> listArticles(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) String pathologie,
			@RequestParam(required = false) LocalDate dateDebut,
			@RequestParam(required = false) LocalDate dateFin) {
		return ResponseEntity.ok(
				nutritionArticleService.listArticles(page, size, q, pathologie, dateDebut, dateFin));
	}

	/**
	 * Articles publiés par un nutritionniste donné ({@code nutritionnisteId} = identifiant utilisateur / {@code users.id}).
	 */
	@GetMapping("/nutritionnistes/{nutritionnisteId}/articles")
	public ResponseEntity<PageResponse<ArticleByNutritionnisteResponse>> listArticlesByNutritionniste(
			@PathVariable long nutritionnisteId,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) String pathologie,
			@RequestParam(required = false) LocalDate dateDebut,
			@RequestParam(required = false) LocalDate dateFin) {
		return ResponseEntity.ok(nutritionArticleService.listArticlesByNutritionniste(
				nutritionnisteId, page, size, q, pathologie, dateDebut, dateFin));
	}

	@GetMapping("/articles/{id}")
	public ResponseEntity<ArticleResponse> getArticle(@PathVariable long id) {
		return ResponseEntity.ok(nutritionArticleService.getArticle(id));
	}

	@PostMapping(path = "/articles", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ArticleResponse> createArticle(
			@RequestPart("titre") String titre,
			@RequestPart("contenu") String contenu,
			@RequestPart("rubriqueId") String rubriqueId,
			@RequestPart(value = "datePublication", required = false) String datePublication,
			@RequestPart("couverture") MultipartFile couverture,
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		ArticleCreateRequest request = new ArticleCreateRequest(
				titre,
				contenu,
				parseLongRequired(rubriqueId, "rubriqueId"),
				parseDateTimeOrNull(datePublication));
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(nutritionArticleService.createArticle(request, couverture, currentUser.userId()));
	}

	@PutMapping(path = "/articles/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ArticleResponse> updateArticle(
			@PathVariable long id,
			@RequestPart("titre") String titre,
			@RequestPart("contenu") String contenu,
			@RequestPart("rubriqueId") String rubriqueId,
			@RequestPart("datePublication") String datePublication,
			@RequestPart(value = "couverture", required = false) MultipartFile couverture,
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		ArticleUpdateRequest request = new ArticleUpdateRequest(
				titre,
				contenu,
				parseLongRequired(rubriqueId, "rubriqueId"),
				parseDateTimeRequired(datePublication));
		return ResponseEntity.ok(nutritionArticleService.updateArticle(id, request, couverture, currentUser.userId()));
	}

	@DeleteMapping("/articles/{id}")
	public ResponseEntity<Void> deleteArticle(
			@PathVariable long id,
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		nutritionArticleService.deleteArticle(id, currentUser.userId());
		return ResponseEntity.noContent().build();
	}

	private static Long parseLongRequired(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " est obligatoire");
		}
		try {
			return Long.parseLong(value.trim());
		} catch (NumberFormatException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					fieldName + " doit être un nombre entier valide");
		}
	}

	private static LocalDateTime parseDateTimeOrNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			return LocalDateTime.parse(value.trim());
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"datePublication invalide (format attendu: yyyy-MM-ddTHH:mm:ss)");
		}
	}

	private static LocalDateTime parseDateTimeRequired(String value) {
		LocalDateTime parsed = parseDateTimeOrNull(value);
		if (parsed == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "datePublication est obligatoire");
		}
		return parsed;
	}
}
