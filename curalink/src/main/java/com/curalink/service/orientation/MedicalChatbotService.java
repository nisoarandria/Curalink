package com.curalink.service.orientation;

import com.curalink.config.GeminiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
import static org.springframework.http.HttpStatus.TOO_MANY_REQUESTS;

@Service
public class MedicalChatbotService {

	private static final Logger LOGGER = LoggerFactory.getLogger(MedicalChatbotService.class);
	private static final String OFF_TOPIC_RESPONSE =
			"Je suis un chatbot medical. Je reponds uniquement aux questions liees aux symptomes et a l'orientation de sante.";
	private static final String TEMPORARY_UNAVAILABLE_RESPONSE =
			"Le chatbot medical est momentanement indisponible. Veuillez reessayer dans quelques instants.";

	private final GeminiProperties geminiProperties;
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper;

	public MedicalChatbotService(
			GeminiProperties geminiProperties,
			RestTemplateBuilder restTemplateBuilder,
			ObjectMapper objectMapper) {
		this.geminiProperties = geminiProperties;
		this.restTemplate = restTemplateBuilder.build();
		this.objectMapper = objectMapper;
	}

	public String chatAsHtml(String userMessage) {
		if (geminiProperties.apiKey() == null || geminiProperties.apiKey().isBlank()
				|| geminiProperties.url() == null || geminiProperties.url().isBlank()) {
			throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Configuration Gemini manquante");
		}

		String prompt = """
				Tu es un chatbot medical.
				Ta seule mission: repondre aux questions sur les symptomes et l'orientation medicale.
				Si la question n'est pas medicale, reponds EXACTEMENT:
				"%s"

				Regles de sortie:
				1) Reponse courte et claire.
				2) Pas de markdown.
				3) Du texte simple uniquement.

				Message utilisateur:
				%s
				""".formatted(OFF_TOPIC_RESPONSE, userMessage.trim());

		Map<String, Object> requestBody = Map.of(
				"contents", List.of(Map.of(
						"parts", List.of(Map.of("text", prompt)))),
				"generationConfig", Map.of(
						"responseMimeType", "text/plain",
						"temperature", 0.2));

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

		ResponseEntity<String> response;
		try {
			response = restTemplate.exchange(
					URI.create(geminiProperties.url() + "?key=" + geminiProperties.apiKey()),
					HttpMethod.POST,
					entity,
					String.class);
		} catch (HttpStatusCodeException e) {
			LOGGER.warn("Erreur HTTP Gemini: status={}, body={}", e.getStatusCode(), sanitize(e.getResponseBodyAsString()));
			if (e.getStatusCode() == TOO_MANY_REQUESTS) {
				return toHtml(TEMPORARY_UNAVAILABLE_RESPONSE);
			}
			String reason = "Echec d'appel au chatbot medical IA (%s)".formatted(e.getStatusCode());
			throw new ResponseStatusException(BAD_GATEWAY, reason);
		} catch (ResourceAccessException e) {
			LOGGER.warn("Erreur reseau Gemini: {}", e.getMessage());
			return toHtml(TEMPORARY_UNAVAILABLE_RESPONSE);
		} catch (Exception e) {
			LOGGER.error("Erreur inattendue lors de l'appel Gemini", e);
			throw new ResponseStatusException(BAD_GATEWAY, "Echec d'appel au chatbot medical IA");
		}

		String answer = extractGeminiText(response.getBody());
		return toHtml(answer);
	}

	private String extractGeminiText(String responseBody) {
		try {
			JsonNode root = objectMapper.readTree(responseBody);
			JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
			if (textNode.isMissingNode() || textNode.asText().isBlank()) {
				return OFF_TOPIC_RESPONSE;
			}
			return textNode.asText().trim();
		} catch (Exception e) {
			throw new ResponseStatusException(BAD_GATEWAY, "Reponse invalide du chatbot medical IA");
		}
	}

	private static String toHtml(String plainText) {
		String safe = escapeHtml(plainText);
		safe = safe.replace("\r\n", "\n").replace("\n", "<br/>");
		return "<div class=\"medical-chatbot-response\"><p>" + safe + "</p></div>";
	}

	private static String escapeHtml(String input) {
		return input
				.replace("&", "&amp;")
				.replace("<", "&lt;")
				.replace(">", "&gt;")
				.replace("\"", "&quot;")
				.replace("'", "&#39;");
	}

	private static String sanitize(String body) {
		if (body == null || body.isBlank()) {
			return "";
		}
		String compact = body.replaceAll("\\s+", " ").trim();
		return compact.length() > 300 ? compact.substring(0, 300) + "..." : compact;
	}
}
