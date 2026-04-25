package com.curalink.api.medecin;

import com.curalink.api.medecin.dto.AntecedentResponse;
import com.curalink.api.medecin.dto.ConstanteVitaleResponse;
import com.curalink.api.medecin.dto.ConsultationResponse;
import com.curalink.api.medecin.dto.CreateAntecedentRequest;
import com.curalink.api.medecin.dto.CreateConstanteVitaleRequest;
import com.curalink.api.medecin.dto.CreateConsultationRequest;
import com.curalink.api.medecin.dto.OrdonnanceResponse;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.medecin.MedecinConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequireUserTypes(UserType.MEDECIN)
public class MedecinConsultationController {

	private final MedecinConsultationService medecinConsultationService;

	public MedecinConsultationController(MedecinConsultationService medecinConsultationService) {
		this.medecinConsultationService = medecinConsultationService;
	}

	@PostMapping("/consultations")
	public ResponseEntity<ConsultationResponse> createConsultation(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@Valid @RequestBody CreateConsultationRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(medecinConsultationService.createConsultation(currentUser, request));
	}

	@PostMapping("/{patientId}/constantes")
	public ResponseEntity<ConstanteVitaleResponse> addConstanteForPatient(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long patientId,
			@Valid @RequestBody CreateConstanteVitaleRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(medecinConsultationService.addConstanteForPatient(currentUser, patientId, request));
	}

	@GetMapping("/patients/{patientId}/antecedents")
	public ResponseEntity<List<AntecedentResponse>> listAntecedents(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long patientId) {
		return ResponseEntity.ok(medecinConsultationService.listAntecedents(currentUser, patientId));
	}

	@GetMapping("/medecins/me/patients/{patientId}/antecedents")
	public ResponseEntity<List<AntecedentResponse>> listAntecedentsForCurrentMedecin(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long patientId) {
		return ResponseEntity.ok(medecinConsultationService.listAntecedents(currentUser, patientId));
	}

	@GetMapping("/medecins/me/patients/{patientId}/constantes")
	public ResponseEntity<List<ConstanteVitaleResponse>> listConstantesByPatient(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long patientId) {
		return ResponseEntity.ok(medecinConsultationService.listConstantesByPatient(currentUser, patientId));
	}

	@GetMapping("/medecins/me/patients/{patientId}/consultations")
	public ResponseEntity<List<ConsultationResponse>> listConsultationsByPatient(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long patientId) {
		return ResponseEntity.ok(medecinConsultationService.listConsultationsByPatient(currentUser, patientId));
	}

	@PostMapping("/patients/{patientId}/antecedents")
	public ResponseEntity<AntecedentResponse> addAntecedent(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long patientId,
			@Valid @RequestBody CreateAntecedentRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(medecinConsultationService.addAntecedent(currentUser, patientId, request));
	}

	@PostMapping(path = "/consultations/{consultationId}/ordonnance", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<OrdonnanceResponse> createOrdonnance(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long consultationId,
			@RequestPart("pdfContent") MultipartFile pdfContent) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(medecinConsultationService.createOrdonnance(currentUser, consultationId, pdfContent));
	}
}
