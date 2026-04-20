package com.curalink.service.nutrition;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.nutrition.dto.ArticleCreateRequest;
import com.curalink.api.nutrition.dto.ArticleResponse;
import com.curalink.api.nutrition.dto.ArticleUpdateRequest;
import com.curalink.api.nutrition.dto.RubriqueResponse;
import com.curalink.api.nutrition.dto.RubriqueSummary;
import com.curalink.model.nutrition.Article;
import com.curalink.model.nutrition.RubriqueNutritionnelle;
import com.curalink.model.user.Nutritionniste;
import com.curalink.model.user.User;
import com.curalink.repository.ArticleRepository;
import com.curalink.repository.RubriqueNutritionnelleRepository;
import com.curalink.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class NutritionArticleService {

	private static final int MAX_PAGE_SIZE = 100;

	private final ArticleRepository articleRepository;
	private final RubriqueNutritionnelleRepository rubriqueRepository;
	private final UserRepository userRepository;

	public NutritionArticleService(
			ArticleRepository articleRepository,
			RubriqueNutritionnelleRepository rubriqueRepository,
			UserRepository userRepository) {
		this.articleRepository = articleRepository;
		this.rubriqueRepository = rubriqueRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<RubriqueResponse> listRubriques() {
		return rubriqueRepository.findAll(Sort.by(Sort.Direction.ASC, "pathologie")).stream()
				.map(r -> new RubriqueResponse(r.getId(), r.getTitre(), r.getDescription(), r.getPathologie()))
				.toList();
	}

	@Transactional(readOnly = true)
	public PageResponse<ArticleResponse> listArticles(
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
		Specification<Article> spec = ArticleSpecifications.withFilters(q, pathologieNorm, dateDebut, dateFin);
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.DESC, "datePublication"));
		Page<Article> result = articleRepository.findAll(spec, pageable);
		return PageResponse.from(result.map(this::toResponse));
	}

	@Transactional(readOnly = true)
	public ArticleResponse getArticle(long id) {
		Article a = articleRepository.findDetailById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
		return toResponse(a);
	}

	@Transactional
	public ArticleResponse createArticle(ArticleCreateRequest request, long nutritionnisteUserId) {
		Nutritionniste auteur = requireNutritionniste(nutritionnisteUserId);
		RubriqueNutritionnelle rubrique = rubriqueRepository.findById(request.rubriqueId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rubrique introuvable"));
		LocalDateTime published = request.datePublication() != null ? request.datePublication() : LocalDateTime.now();
		Article article = new Article(
				request.titre().trim(),
				request.contenu().trim(),
				published,
				rubrique,
				auteur);
		return toResponse(articleRepository.save(article));
	}

	@Transactional
	public ArticleResponse updateArticle(long id, ArticleUpdateRequest request, long nutritionnisteUserId) {
		requireNutritionniste(nutritionnisteUserId);
		Article article = articleRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
		RubriqueNutritionnelle rubrique = rubriqueRepository.findById(request.rubriqueId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rubrique introuvable"));
		article.setTitre(request.titre().trim());
		article.setContenu(request.contenu().trim());
		article.setDatePublication(request.datePublication());
		article.setRubrique(rubrique);
		return toResponse(articleRepository.save(article));
	}

	@Transactional
	public void deleteArticle(long id, long nutritionnisteUserId) {
		requireNutritionniste(nutritionnisteUserId);
		if (!articleRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable");
		}
		articleRepository.deleteById(id);
	}

	private Nutritionniste requireNutritionniste(long userId) {
		User u = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(u instanceof Nutritionniste n)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Profil nutritionniste requis");
		}
		return n;
	}

	private ArticleResponse toResponse(Article a) {
		RubriqueNutritionnelle r = a.getRubrique();
		return new ArticleResponse(
				a.getId(),
				a.getTitre(),
				a.getContenu(),
				a.getDatePublication(),
				new RubriqueSummary(r.getId(), r.getTitre(), r.getPathologie()),
				a.getAuteur().getId());
	}

	private static int clampSize(int size) {
		return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
	}
}
