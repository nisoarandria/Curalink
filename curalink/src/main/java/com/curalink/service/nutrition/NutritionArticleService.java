package com.curalink.service.nutrition;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.nutrition.dto.ArticleByNutritionnisteResponse;
import com.curalink.api.nutrition.dto.ArticleCreateRequest;
import com.curalink.api.nutrition.dto.ArticleListResponse;
import com.curalink.api.nutrition.dto.ArticleResponse;
import com.curalink.api.nutrition.dto.RubriqueArticleCountResponse;
import com.curalink.api.nutrition.dto.ArticleUpdateRequest;
import com.curalink.api.nutrition.dto.RubriqueResponse;
import com.curalink.api.nutrition.dto.RubriqueSummary;
import com.curalink.config.ServiceItemStorageProperties;
import com.curalink.model.nutrition.Article;
import com.curalink.model.nutrition.RubriqueNutritionnelle;
import com.curalink.model.user.Nutritionniste;
import com.curalink.model.user.User;
import com.curalink.repository.ArticleRepository;
import com.curalink.repository.RubriqueNutritionnelleRepository;
import com.curalink.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class NutritionArticleService {

	private static final int MAX_PAGE_SIZE = 100;
	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
			"image/jpeg", "image/png", "image/gif", "image/webp", "image/avif");
	private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp", "avif");
	private static final String COVER_FOLDER = "article_couverture";

	private final ArticleRepository articleRepository;
	private final RubriqueNutritionnelleRepository rubriqueRepository;
	private final UserRepository userRepository;
	private final ServiceItemStorageProperties storageProperties;
	private final RestTemplate restTemplate;
	private String publicObjectBaseUrl;
	private String objectBaseUrl;

	public NutritionArticleService(
			ArticleRepository articleRepository,
			RubriqueNutritionnelleRepository rubriqueRepository,
			UserRepository userRepository,
			ServiceItemStorageProperties storageProperties,
			RestTemplateBuilder restTemplateBuilder) {
		this.articleRepository = articleRepository;
		this.rubriqueRepository = rubriqueRepository;
		this.userRepository = userRepository;
		this.storageProperties = storageProperties;
		this.restTemplate = restTemplateBuilder.build();
	}

	@PostConstruct
	void initStorage() {
		if (!StringUtils.hasText(storageProperties.supabaseUrl())
				|| !StringUtils.hasText(storageProperties.bucket())
				|| !StringUtils.hasText(storageProperties.apiKey())) {
			this.publicObjectBaseUrl = null;
			this.objectBaseUrl = null;
			return;
		}
		String base = storageProperties.supabaseUrl().trim();
		if (base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		String bucket = storageProperties.bucket().trim();
		this.publicObjectBaseUrl = base + "/storage/v1/object/public/" + bucket + "/";
		this.objectBaseUrl = base + "/storage/v1/object/" + bucket + "/";
	}

	@Transactional(readOnly = true)
	public List<RubriqueResponse> listRubriques() {
		return rubriqueRepository.findAll(Sort.by(Sort.Direction.ASC, "pathologie")).stream()
				.map(r -> new RubriqueResponse(r.getId(), r.getTitre(), r.getDescription(), r.getPathologie()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<RubriqueArticleCountResponse> listRubriquesWithArticleCount() {
		return rubriqueRepository.findRubriquesWithArticleCount();
	}

	@Transactional(readOnly = true)
	public ArticleListResponse listArticles(
			int page,
			int size,
			String q,
			String pathologie,
			LocalDate dateDebut,
			LocalDate dateFin) {
		if (dateDebut != null && dateFin != null && dateDebut.isAfter(dateFin)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dateDebut doit être antérieure ou égale à dateFin");
		}
		String pathologieNorm = pathologie != null && !pathologie.isBlank()
				? pathologie.trim().toUpperCase(Locale.ROOT)
				: null;
		Specification<Article> spec = ArticleSpecifications.withFilters(q, pathologieNorm, dateDebut, dateFin, null);
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.DESC, "datePublication"));
		Page<Article> result = articleRepository.findAll(spec, pageable);
		Page<ArticleResponse> mapped = result.map(this::toResponse);
		return new ArticleListResponse(
				resolveRubriqueDescription(pathologieNorm),
				mapped.getContent(),
				mapped.getNumber(),
				mapped.getSize(),
				mapped.getTotalElements(),
				mapped.getTotalPages());
	}

	@Transactional(readOnly = true)
	public PageResponse<ArticleByNutritionnisteResponse> listArticlesByNutritionniste(
			long nutritionnisteUserId,
			int page,
			int size,
			String q,
			String pathologie,
			LocalDate dateDebut,
			LocalDate dateFin) {
		requireNutritionnisteUserExists(nutritionnisteUserId);
		if (dateDebut != null && dateFin != null && dateDebut.isAfter(dateFin)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dateDebut doit être antérieure ou égale à dateFin");
		}
		String pathologieNorm = pathologie != null && !pathologie.isBlank()
				? pathologie.trim().toUpperCase(Locale.ROOT)
				: null;
		Specification<Article> spec = ArticleSpecifications.withFilters(
				q, pathologieNorm, dateDebut, dateFin, nutritionnisteUserId);
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.DESC, "datePublication"));
		Page<Article> result = articleRepository.findAll(spec, pageable);
		return PageResponse.from(result.map(this::toResponseByNutritionnisteList));
	}

	@Transactional(readOnly = true)
	public ArticleResponse getArticle(long id) {
		Article a = articleRepository.findDetailById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
		return toResponse(a);
	}

	@Transactional
	public ArticleResponse createArticle(ArticleCreateRequest request, MultipartFile couverture, long nutritionnisteUserId) {
		Nutritionniste auteur = requireNutritionniste(nutritionnisteUserId);
		RubriqueNutritionnelle rubrique = rubriqueRepository.findById(request.rubriqueId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rubrique introuvable"));
		LocalDateTime published = request.datePublication() != null ? request.datePublication() : LocalDateTime.now();
		String couvertureFile = null;
		if (couverture != null && !couverture.isEmpty()) {
			validateImage(couverture);
			couvertureFile = storeImageFile(couverture);
		}
		Article article = new Article(
				request.titre().trim(),
				request.contenu().trim(),
				published,
				couvertureFile,
				rubrique,
				auteur);
		try {
			return toResponse(articleRepository.save(article));
		} catch (RuntimeException e) {
			deleteFileQuietly(couvertureFile);
			throw e;
		}
	}

	@Transactional
	public ArticleResponse createArticle(ArticleCreateRequest request, long nutritionnisteUserId) {
		return createArticle(request, null, nutritionnisteUserId);
	}

	@Transactional
	public ArticleResponse updateArticle(long id, ArticleUpdateRequest request, MultipartFile couverture, long nutritionnisteUserId) {
		requireNutritionniste(nutritionnisteUserId);
		Article article = articleRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
		RubriqueNutritionnelle rubrique = rubriqueRepository.findById(request.rubriqueId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rubrique introuvable"));
		article.setTitre(request.titre().trim());
		article.setContenu(request.contenu().trim());
		article.setDatePublication(request.datePublication());
		article.setRubrique(rubrique);
		String previousFile = article.getCouvertureFile();
		if (couverture != null && !couverture.isEmpty()) {
			validateImage(couverture);
			String newFile = storeImageFile(couverture);
			article.setCouvertureFile(newFile);
			Article saved = articleRepository.save(article);
			if (!newFile.equals(previousFile)) {
				deleteFileQuietly(previousFile);
			}
			return toResponse(saved);
		}
		return toResponse(articleRepository.save(article));
	}

	@Transactional
	public ArticleResponse updateArticle(long id, ArticleUpdateRequest request, long nutritionnisteUserId) {
		return updateArticle(id, request, null, nutritionnisteUserId);
	}

	@Transactional
	public void deleteArticle(long id, long nutritionnisteUserId) {
		requireNutritionniste(nutritionnisteUserId);
		if (!articleRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable");
		}
		Article article = articleRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
		String coverFile = article.getCouvertureFile();
		articleRepository.delete(article);
		deleteFileQuietly(coverFile);
	}

	private Nutritionniste requireNutritionniste(long userId) {
		User u = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(u instanceof Nutritionniste n)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Profil nutritionniste requis");
		}
		return n;
	}

	private void requireNutritionnisteUserExists(long userId) {
		User u = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutritionniste introuvable"));
		if (!(u instanceof Nutritionniste)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutritionniste introuvable");
		}
	}

	private ArticleResponse toResponse(Article a) {
		RubriqueNutritionnelle r = a.getRubrique();
		return new ArticleResponse(
				a.getId(),
				a.getTitre(),
				a.getContenu(),
				a.getDatePublication(),
				buildPublicUrl(a.getCouvertureFile()),
				new RubriqueSummary(r.getId(), r.getTitre(), r.getPathologie(), r.getDescription()),
				a.getAuteur().getId());
	}

	private ArticleByNutritionnisteResponse toResponseByNutritionnisteList(Article a) {
		RubriqueNutritionnelle r = a.getRubrique();
		User auteur = a.getAuteur();
		return new ArticleByNutritionnisteResponse(
				a.getId(),
				a.getTitre(),
				a.getContenu(),
				a.getDatePublication(),
				buildPublicUrl(a.getCouvertureFile()),
				new RubriqueSummary(r.getId(), r.getTitre(), r.getPathologie(), r.getDescription()),
				formatAuteurNom(auteur));
	}

	private static String formatAuteurNom(User auteur) {
		String prenom = auteur.getPrenom() == null ? "" : auteur.getPrenom().trim();
		String nom = auteur.getNom() == null ? "" : auteur.getNom().trim();
		if (!prenom.isEmpty() && !nom.isEmpty()) {
			return prenom + " " + nom;
		}
		return !nom.isEmpty() ? nom : prenom;
	}

	private void validateImage(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Une image de couverture est requise");
		}
		String ct = file.getContentType();
		if (ct != null && !ALLOWED_CONTENT_TYPES.contains(ct.toLowerCase(Locale.ROOT))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Type de fichier non autorisé (JPEG, PNG, GIF ou WebP uniquement)");
		}
		String ext = resolveExtension(file);
		if (ext == null || !ALLOWED_EXTENSIONS.contains(ext)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Extension autorisée : jpg, jpeg, png, gif, webp");
		}
	}

	private String storeImageFile(MultipartFile file) {
		ensureSupabaseConfigured();
		String ext = resolveExtension(file);
		if (ext == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible de déterminer le type d’image");
		}
		String objectKey = COVER_FOLDER + "/" + UUID.randomUUID().toString().replace("-", "") + "." + ext;
		try {
			HttpHeaders headers = new HttpHeaders();
			headers.set("apikey", storageProperties.apiKey());
			headers.setBearerAuth(storageProperties.apiKey());
			headers.setContentType(MediaType.parseMediaType(defaultContentType(file)));
			headers.set("x-upsert", "false");

			HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);
			ResponseEntity<String> response = restTemplate.exchange(
					URI.create(objectBaseUrl + objectKey),
					HttpMethod.POST,
					requestEntity,
					String.class);
			if (!response.getStatusCode().is2xxSuccessful()) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Upload Supabase echoue");
			}
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lecture du fichier impossible");
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Envoi de la couverture vers Supabase impossible");
		}
		return objectKey;
	}

	private static String resolveExtension(MultipartFile file) {
		String ext = extractExtension(file.getOriginalFilename());
		if (ext != null && ALLOWED_EXTENSIONS.contains(ext)) {
			return ext;
		}
		String ct = file.getContentType();
		if (ct == null) {
			return null;
		}
		return switch (ct.toLowerCase(Locale.ROOT)) {
			case "image/jpeg" -> "jpg";
			case "image/png" -> "png";
			case "image/gif" -> "gif";
			case "image/webp" -> "webp";
			case "image/avif" -> "avif";
			default -> null;
		};
	}

	private static String extractExtension(String originalFilename) {
		if (!StringUtils.hasText(originalFilename) || !originalFilename.contains(".")) {
			return null;
		}
		String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
		if ("jpeg".equals(ext)) {
			return "jpg";
		}
		return ext;
	}

	private void deleteFileQuietly(String filename) {
		if (!StringUtils.hasText(filename) || !isSupabaseConfigured()) {
			return;
		}
		try {
			HttpHeaders headers = new HttpHeaders();
			headers.set("apikey", storageProperties.apiKey());
			headers.setBearerAuth(storageProperties.apiKey());
			restTemplate.exchange(
					URI.create(objectBaseUrl + filename),
					HttpMethod.DELETE,
					new HttpEntity<>(headers),
					String.class);
		} catch (Exception ignored) {
			// best effort
		}
	}

	private String buildPublicUrl(String objectKey) {
		if (!StringUtils.hasText(objectKey)) {
			return null;
		}
		if (!isSupabaseConfigured()) {
			return objectKey;
		}
		return publicObjectBaseUrl + objectKey;
	}

	private static String defaultContentType(MultipartFile file) {
		return StringUtils.hasText(file.getContentType()) ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
	}

	private boolean isSupabaseConfigured() {
		return StringUtils.hasText(publicObjectBaseUrl) && StringUtils.hasText(objectBaseUrl);
	}

	private void ensureSupabaseConfigured() {
		if (!isSupabaseConfigured()) {
			throw new ResponseStatusException(
					HttpStatus.INTERNAL_SERVER_ERROR,
					"Supabase Storage non configure (SUPABASE_URL/SUPABASE_STORAGE_BUCKET/SUPABASE_SERVICE_ROLE_KEY)");
		}
	}

	private static int clampSize(int size) {
		return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
	}

	private String resolveRubriqueDescription(String pathologieNorm) {
		if (!StringUtils.hasText(pathologieNorm)) {
			return null;
		}
		return rubriqueRepository.findByPathologie(pathologieNorm)
				.map(RubriqueNutritionnelle::getDescription)
				.orElse(null);
	}
}
