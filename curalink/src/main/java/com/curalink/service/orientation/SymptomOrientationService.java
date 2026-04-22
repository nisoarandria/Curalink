package com.curalink.service.orientation;

import com.curalink.api.orientation.dto.SymptomOrientationResponse;
import com.curalink.config.GeminiProperties;
import com.curalink.model.catalog.ServiceItem;
import com.curalink.repository.ServiceItemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class SymptomOrientationService {

	private static final String SAFETY_MESSAGE =
			"Ceci est une orientation informative. En cas d'urgence (douleur thoracique intense, detresse respiratoire, malaise), contactez immediatement les urgences.";

	private final ServiceItemRepository serviceItemRepository;
	private final GeminiProperties geminiProperties;
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper;

	public SymptomOrientationService(
			ServiceItemRepository serviceItemRepository,
			GeminiProperties geminiProperties,
			RestTemplateBuilder restTemplateBuilder,
			ObjectMapper objectMapper) {
		this.serviceItemRepository = serviceItemRepository;
		this.geminiProperties = geminiProperties;
		this.restTemplate = restTemplateBuilder.build();
		this.objectMapper = objectMapper;
	}

	@Transactional(readOnly = true)
	public SymptomOrientationResponse orient(String userMessage) {
		List<ServiceItem> services = serviceItemRepository.findAllByOrderByNomAsc();
		if (services.isEmpty()) {
			throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Aucun service n'est configure sur la plateforme");
		}

		if (geminiProperties.apiKey() == null || geminiProperties.apiKey().isBlank()
				|| geminiProperties.url() == null || geminiProperties.url().isBlank()) {
			throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Configuration Gemini manquante");
		}

		String serviceList = services.stream()
				.map(s -> "{\"id\":" + s.getId() + ",\"nom\":\"" + sanitize(s.getNom()) + "\",\"description\":\""
						+ sanitize(defaultString(s.getDescription())) + "\"}")
				.reduce((a, b) -> a + "," + b)
				.orElse("");

		String prompt = """
				Tu es un agent d'orientation medicale pour une plateforme de sante.
				Tu dois UNIQUEMENT traiter des messages de symptomes.
				Si la question n'est pas medicale/symptomes, retourne serviceId=null et explique que tu ne traites que les symptomes.

				Tu dois recommander un service PARMI CETTE LISTE STRICTE:
				[%s]

				Regles:
				1) Ne jamais inventer un service hors liste.
				2) Repondre strictement en JSON valide compact, sans markdown.
				3) Format EXACT:
				{"serviceId":<number|null>,"raison":"<texte court>","confidence":<0..1>}
				4) Si incertain ou symptomes graves, choisir le service le plus pertinent et mentionner la prudence dans raison.

				Message utilisateur:
				%s
				""".formatted(serviceList, userMessage.trim());

		Map<String, Object> requestBody = Map.of(
				"contents", List.of(Map.of(
						"parts", List.of(Map.of("text", prompt)))),
				"generationConfig", Map.of(
						"responseMimeType", "application/json",
						"temperature", 0.2));

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

		URI uri = URI.create(geminiProperties.url() + "?key=" + geminiProperties.apiKey());
		ResponseEntity<String> response;
		try {
			response = restTemplate.exchange(uri, HttpMethod.POST, entity, String.class);
		} catch (Exception e) {
			throw new ResponseStatusException(BAD_GATEWAY, "Echec d'appel au service d'orientation IA");
		}

		return parseGeminiResponse(response.getBody(), services);
	}

	private SymptomOrientationResponse parseGeminiResponse(String responseBody, List<ServiceItem> services) {
		try {
			JsonNode root = objectMapper.readTree(responseBody);
			JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
			if (textNode.isMissingNode() || textNode.asText().isBlank()) {
				throw new IllegalArgumentException("Reponse IA vide");
			}

			JsonNode aiJson = objectMapper.readTree(textNode.asText());
			Long serviceId = aiJson.hasNonNull("serviceId") ? aiJson.get("serviceId").asLong() : null;
			String raison = aiJson.path("raison").asText("Orientation indisponible.");
			double confidence = aiJson.path("confidence").asDouble(0.0);

			ServiceItem chosen = null;
			if (serviceId != null) {
				final Long serviceIdForLookup = serviceId;
				chosen = services.stream().filter(s -> s.getId().equals(serviceIdForLookup)).findFirst().orElse(null);
				if (chosen == null) {
					serviceId = null;
					raison = "Le modele a retourne un service invalide. Merci de reformuler vos symptomes.";
					confidence = 0.0;
				}
			}

			confidence = Math.max(0.0, Math.min(1.0, confidence));
			return new SymptomOrientationResponse(
					serviceId,
					chosen != null ? chosen.getNom() : null,
					raison,
					confidence,
					SAFETY_MESSAGE);
		} catch (Exception e) {
			throw new ResponseStatusException(BAD_GATEWAY, "Reponse IA invalide pour l'orientation");
		}
	}

	private static String sanitize(String value) {
		return value.replace("\"", "\\\"");
	}

	private static String defaultString(String value) {
		return value == null ? "" : value;
	}
}
