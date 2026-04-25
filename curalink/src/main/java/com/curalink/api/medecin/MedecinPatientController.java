package com.curalink.api.medecin;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.medecin.dto.MedecinPatientSummary;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.medecin.MedecinPatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/medecins/me")
@RequireUserTypes(UserType.MEDECIN)
public class MedecinPatientController {

	private final MedecinPatientService medecinPatientService;

	public MedecinPatientController(MedecinPatientService medecinPatientService) {
		this.medecinPatientService = medecinPatientService;
	}

	@GetMapping("/patients")
	public ResponseEntity<PageResponse<MedecinPatientSummary>> listMyPatients(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q) {
		return ResponseEntity.ok(medecinPatientService.listMyPatients(currentUser, page, size, q));
	}

	@GetMapping("/patients/{patientId}")
	public ResponseEntity<MedecinPatientSummary> getMyPatientDetail(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long patientId) {
		return ResponseEntity.ok(medecinPatientService.getMyPatientDetail(currentUser, patientId));
	}
}
