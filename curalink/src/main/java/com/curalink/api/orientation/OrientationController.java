package com.curalink.api.orientation;

import com.curalink.api.orientation.dto.MedicalChatRequest;
import com.curalink.api.orientation.dto.SymptomOrientationRequest;
import com.curalink.api.orientation.dto.SymptomOrientationResponse;
import com.curalink.service.orientation.MedicalChatbotService;
import com.curalink.service.orientation.SymptomOrientationService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orientation")
public class OrientationController {

	private final SymptomOrientationService symptomOrientationService;
	private final MedicalChatbotService medicalChatbotService;

	public OrientationController(
			SymptomOrientationService symptomOrientationService,
			MedicalChatbotService medicalChatbotService) {
		this.symptomOrientationService = symptomOrientationService;
		this.medicalChatbotService = medicalChatbotService;
	}

	/**
	 * Recoit un message de symptomes et retourne le service recommande parmi les services disponibles.
	 */
	@PostMapping("/symptomes")
	public ResponseEntity<SymptomOrientationResponse> orientBySymptoms(
			@Valid @RequestBody SymptomOrientationRequest request) {
		return ResponseEntity.ok(symptomOrientationService.orient(request.message()));
	}

	/**
	 * Chat medical strict: renvoie uniquement du HTML pour faciliter le rendu front.
	 */
	@PostMapping(path = "/chat", produces = MediaType.TEXT_HTML_VALUE)
	public ResponseEntity<String> medicalChat(
			@Valid @RequestBody MedicalChatRequest request) {
		return ResponseEntity.ok(medicalChatbotService.chatAsHtml(request.message()));
	}
}
