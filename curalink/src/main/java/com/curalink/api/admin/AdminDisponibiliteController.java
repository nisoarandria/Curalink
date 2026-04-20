package com.curalink.api.admin;

import com.curalink.api.admin.dto.AdminDisponibiliteResponse;
import com.curalink.api.admin.dto.PlanningValidationResponse;
import com.curalink.api.dto.PageResponse;
import com.curalink.api.rendezvous.dto.UpsertDisponibiliteRequest;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.admin.AdminDisponibiliteService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/disponibilites")
@RequireUserTypes(UserType.ADMIN)
public class AdminDisponibiliteController {

	private final AdminDisponibiliteService adminDisponibiliteService;

	public AdminDisponibiliteController(AdminDisponibiliteService adminDisponibiliteService) {
		this.adminDisponibiliteService = adminDisponibiliteService;
	}

	@GetMapping
	public ResponseEntity<PageResponse<AdminDisponibiliteResponse>> list(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) Long medecinId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
			@RequestParam(required = false) String q) {
		return ResponseEntity.ok(adminDisponibiliteService.list(page, size, medecinId, date, q));
	}

	@PostMapping("/medecins/{medecinId}")
	public ResponseEntity<AdminDisponibiliteResponse> createForMedecin(
			@PathVariable long medecinId,
			@Valid @RequestBody UpsertDisponibiliteRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(adminDisponibiliteService.create(medecinId, request));
	}

	@PutMapping("/{id}")
	public ResponseEntity<AdminDisponibiliteResponse> update(
			@PathVariable long id,
			@Valid @RequestBody UpsertDisponibiliteRequest request) {
		return ResponseEntity.ok(adminDisponibiliteService.update(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable long id) {
		adminDisponibiliteService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/{id}/valider")
	public ResponseEntity<AdminDisponibiliteResponse> validateOne(@PathVariable long id) {
		return ResponseEntity.ok(adminDisponibiliteService.validateOne(id));
	}

	@PatchMapping("/medecins/{medecinId}/valider")
	public ResponseEntity<PlanningValidationResponse> validateAllByMedecin(@PathVariable long medecinId) {
		return ResponseEntity.ok(adminDisponibiliteService.validateByMedecin(medecinId));
	}
}
