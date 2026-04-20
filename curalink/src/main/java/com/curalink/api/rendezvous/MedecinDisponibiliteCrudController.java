package com.curalink.api.rendezvous;

import com.curalink.api.rendezvous.dto.DisponibiliteDetailResponse;
import com.curalink.api.rendezvous.dto.UpsertDisponibiliteRequest;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.rendezvous.MedecinDisponibiliteCrudService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medecins/me/disponibilites")
@RequireUserTypes(UserType.MEDECIN)
public class MedecinDisponibiliteCrudController {

	private final MedecinDisponibiliteCrudService medecinDisponibiliteCrudService;

	public MedecinDisponibiliteCrudController(MedecinDisponibiliteCrudService medecinDisponibiliteCrudService) {
		this.medecinDisponibiliteCrudService = medecinDisponibiliteCrudService;
	}

	@GetMapping
	public ResponseEntity<List<DisponibiliteDetailResponse>> listMine(
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		return ResponseEntity.ok(medecinDisponibiliteCrudService.listMine(currentUser));
	}

	@PostMapping
	public ResponseEntity<DisponibiliteDetailResponse> createMine(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@Valid @RequestBody UpsertDisponibiliteRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(medecinDisponibiliteCrudService.createMine(currentUser, request));
	}

	@PutMapping("/{id}")
	public ResponseEntity<DisponibiliteDetailResponse> updateMine(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id,
			@Valid @RequestBody UpsertDisponibiliteRequest request) {
		return ResponseEntity.ok(medecinDisponibiliteCrudService.updateMine(currentUser, id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteMine(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		medecinDisponibiliteCrudService.deleteMine(currentUser, id);
		return ResponseEntity.noContent().build();
	}
}
