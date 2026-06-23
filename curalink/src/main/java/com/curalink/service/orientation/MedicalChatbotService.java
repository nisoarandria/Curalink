package com.curalink.service.orientation;

import com.curalink.config.GeminiProperties;
import com.curalink.config.GroqProperties;
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

import java.net.URI;
import java.util.List;
import java.util.Map;

@Service
public class MedicalChatbotService {

	private static final Logger LOGGER = LoggerFactory.getLogger(MedicalChatbotService.class);
	private static final String OFF_TOPIC_RESPONSE =
			"Je suis un chatbot medical. Je reponds uniquement aux questions liees aux symptomes et a l'orientation de sante.";
	private static final String TEMPORARY_UNAVAILABLE_RESPONSE =
			"Le chatbot medical est momentanement indisponible. Veuillez reessayer dans quelques instants.";

	private final GeminiProperties geminiProperties;
	private final GroqProperties groqProperties;
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper;

	public MedicalChatbotService(
			GeminiProperties geminiProperties,
			GroqProperties groqProperties,
			RestTemplateBuilder restTemplateBuilder,
			ObjectMapper objectMapper) {
		this.geminiProperties = geminiProperties;
		this.groqProperties = groqProperties;
		this.restTemplate = restTemplateBuilder.build();
		this.objectMapper = objectMapper;
	}

	public String chatAsHtml(String userMessage) {
		String prompt = buildPrompt(userMessage);

		// 1) Gemini par defaut
		String answer = callGemini(prompt);
		if (answer != null) {
			return toHtml(answer);
		}

		// 2) Fallback Groq si Gemini echoue
		answer = callGroq(prompt);
		if (answer != null) {
			return toHtml(answer);
		}

		// 3) Message d'indisponibilite uniquement si les deux ont echoue
		return toHtml(TEMPORARY_UNAVAILABLE_RESPONSE);
	}

	private String buildPrompt(String userMessage) {
		return """
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
	}

	private String callGemini(String prompt) {
		if (!isGeminiConfigured()) {
			LOGGER.warn("Configuration Gemini manquante — tentative Groq");
			return null;
		}

		Map<String, Object> requestBody = Map.of(
				"contents", List.of(Map.of(
						"parts", List.of(Map.of("text", prompt)))),
				"generationConfig", Map.of(
						"responseMimeType", "text/plain",
						"temperature", 0.2));

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

		try {
			ResponseEntity<String> response = restTemplate.exchange(
					URI.create(geminiProperties.url() + "?key=" + geminiProperties.apiKey()),
					HttpMethod.POST,
					entity,
					String.class);
			return parseGeminiText(response.getBody());
		} catch (HttpStatusCodeException e) {
			LOGGER.warn(
					"Erreur HTTP Gemini: status={}, body={} — fallback Groq",
					e.getStatusCode(),
					sanitize(e.getResponseBodyAsString()));
			return null;
		} catch (ResourceAccessException e) {
			LOGGER.warn("Erreur reseau Gemini: {} — fallback Groq", e.getMessage());
			return null;
		} catch (Exception e) {
			LOGGER.warn("Erreur inattendue Gemini: {} — fallback Groq", e.getMessage());
			return null;
		}
	}

	private String callGroq(String prompt) {
		if (!isGroqConfigured()) {
			LOGGER.warn("Configuration Groq manquante — message d'indisponibilite");
			return null;
		}

		Map<String, Object> requestBody = Map.of(
				"model", groqProperties.model(),
				"messages", List.of(Map.of("role", "user", "content", prompt)),
				"temperature", 0.2);

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setBearerAuth(groqProperties.apiKey());
		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

		try {
			ResponseEntity<String> response = restTemplate.exchange(
					URI.create(groqProperties.url()),
					HttpMethod.POST,
					entity,
					String.class);
			return parseGroqText(response.getBody());
		} catch (HttpStatusCodeException e) {
			LOGGER.warn(
					"Erreur HTTP Groq: status={}, body={}",
					e.getStatusCode(),
					sanitize(e.getResponseBodyAsString()));
			return null;
		} catch (ResourceAccessException e) {
			LOGGER.warn("Erreur reseau Groq: {}", e.getMessage());
			return null;
		} catch (Exception e) {
			LOGGER.warn("Erreur inattendue Groq: {}", e.getMessage());
			return null;
		}
	}

	private boolean isGeminiConfigured() {
		return geminiProperties.apiKey() != null && !geminiProperties.apiKey().isBlank()
				&& geminiProperties.url() != null && !geminiProperties.url().isBlank();
	}

	private boolean isGroqConfigured() {
		return groqProperties.apiKey() != null && !groqProperties.apiKey().isBlank()
				&& groqProperties.url() != null && !groqProperties.url().isBlank()
				&& groqProperties.model() != null && !groqProperties.model().isBlank();
	}

	private String parseGeminiText(String responseBody) {
		try {
			JsonNode root = objectMapper.readTree(responseBody);
			JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
			if (textNode.isMissingNode() || textNode.asText().isBlank()) {
				return OFF_TOPIC_RESPONSE;
			}
			return textNode.asText().trim();
		} catch (Exception e) {
			LOGGER.warn("Reponse Gemini invalide: {} — fallback Groq", e.getMessage());
			return null;
		}
	}

	private String parseGroqText(String responseBody) {
		try {
			JsonNode root = objectMapper.readTree(responseBody);
			JsonNode textNode = root.path("choices").path(0).path("message").path("content");
			if (textNode.isMissingNode() || textNode.asText().isBlank()) {
				return OFF_TOPIC_RESPONSE;
			}
			return textNode.asText().trim();
		} catch (Exception e) {
			LOGGER.warn("Reponse Groq invalide: {}", e.getMessage());
			return null;
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
