package com.curalink.service.admin;

import com.curalink.api.admin.dto.ServiceItemResponse;
import com.curalink.api.dto.PageResponse;
import com.curalink.config.ServiceItemStorageProperties;
import com.curalink.model.catalog.ServiceItem;
import com.curalink.repository.ServiceItemRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminServiceItemService {

	private static final int MAX_PAGE_SIZE = 100;
	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
			"image/jpeg", "image/png", "image/gif", "image/webp", "image/avif");
	private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp", "avif");

	private final ServiceItemRepository serviceItemRepository;
	private final ServiceItemStorageProperties storageProperties;
	private final RestTemplate restTemplate;
	private String publicObjectBaseUrl;
	private String objectBaseUrl;

	public AdminServiceItemService(
			ServiceItemRepository serviceItemRepository,
			ServiceItemStorageProperties storageProperties,
			RestTemplateBuilder restTemplateBuilder) {
		this.serviceItemRepository = serviceItemRepository;
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
	public PageResponse<ServiceItemResponse> list(int page, int size) {
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.ASC, "nom"));
		return PageResponse.from(serviceItemRepository.findAll(pageable).map(this::toResponse));
	}

	@Transactional(readOnly = true)
	public ServiceItemResponse getById(long id) {
		return toResponse(serviceItemRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service introuvable")));
	}

	@Transactional
	public ServiceItemResponse create(String nom, String description, MultipartFile illustration) {
		if (!StringUtils.hasText(nom)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom est requis");
		}
		validateImage(illustration);
		String filename = storeImageFile(illustration);
		try {
			ServiceItem entity = new ServiceItem(
					nom.trim(),
					description != null ? description.trim() : "",
					filename);
			return toResponse(serviceItemRepository.save(entity));
		} catch (RuntimeException e) {
			deleteFileQuietly(filename);
			throw e;
		}
	}

	@Transactional
	public ServiceItemResponse update(long id, String nom, String description, MultipartFile illustration) {
		if (!StringUtils.hasText(nom)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom est requis");
		}
		ServiceItem entity = serviceItemRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service introuvable"));
		entity.setNom(nom.trim());
		entity.setDescription(description != null ? description.trim() : "");

		String previousFile = entity.getIllustrationFile();
		if (illustration != null && !illustration.isEmpty()) {
			validateImage(illustration);
			String newFile = storeImageFile(illustration);
			entity.setIllustrationFile(newFile);
			ServiceItem saved = serviceItemRepository.save(entity);
			if (!newFile.equals(previousFile)) {
				deleteFileQuietly(previousFile);
			}
			return toResponse(saved);
		}
		return toResponse(serviceItemRepository.save(entity));
	}

	@Transactional
	public void delete(long id) {
		ServiceItem entity = serviceItemRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service introuvable"));
		String file = entity.getIllustrationFile();
		serviceItemRepository.delete(entity);
		deleteFileQuietly(file);
	}

	private ServiceItemResponse toResponse(ServiceItem s) {
		return new ServiceItemResponse(
				s.getId(),
				s.getNom(),
				s.getDescription(),
				buildPublicUrl(s.getIllustrationFile()));
	}

	private void validateImage(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Une image d’illustration est requise");
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
		String objectKey = UUID.randomUUID().toString().replace("-", "") + "." + ext;
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
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Lecture du fichier impossible");
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Envoi de l'image vers Supabase impossible");
		}
		return objectKey;
	}

	/** Résout l’extension normalisée (jpg, png, gif, webp) depuis le nom et/ou le Content-Type. */
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
		if (!StringUtils.hasText(filename)) {
			return;
		}
		if (!isSupabaseConfigured()) {
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
			// best effort : ne pas bloquer le flux métier
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
}
