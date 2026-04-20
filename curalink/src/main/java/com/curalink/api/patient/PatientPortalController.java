package com.curalink.api.patient;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.patient.dto.PatientOrdonnanceResponse;
import com.curalink.api.rendezvous.dto.RendezVousResponse;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.patient.PatientPortalService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/patients/me")
@RequireUserTypes(UserType.PATIENT)
public class PatientPortalController {

	private final PatientPortalService patientPortalService;

	public PatientPortalController(PatientPortalService patientPortalService) {
		this.patientPortalService = patientPortalService;
	}

	@GetMapping("/ordonnances")
	public ResponseEntity<PageResponse<PatientOrdonnanceResponse>> listMyOrdonnances(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return ResponseEntity.ok(patientPortalService.listMyOrdonnances(currentUser, page, size, q, date));
	}

	@GetMapping("/ordonnances/{id}/pdf")
	public ResponseEntity<byte[]> downloadMyOrdonnancePdf(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		byte[] pdf = patientPortalService.downloadMyOrdonnancePdf(currentUser, id);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_PDF);
		headers.setContentDisposition(ContentDisposition.attachment().filename("ordonnance-" + id + ".pdf").build());
		return ResponseEntity.ok().headers(headers).body(pdf);
	}

	@GetMapping("/rendezvous")
	public ResponseEntity<PageResponse<RendezVousResponse>> listMyRendezVous(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return ResponseEntity.ok(patientPortalService.listMyRendezVous(currentUser, page, size, q, date));
	}
}
