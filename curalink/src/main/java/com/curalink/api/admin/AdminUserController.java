package com.curalink.api.admin;

import com.curalink.api.admin.dto.CreateStaffRequest;
import com.curalink.api.admin.dto.CreateStaffResponse;
import com.curalink.api.admin.dto.PatientSummary;
import com.curalink.api.admin.dto.StaffRole;
import com.curalink.api.admin.dto.StaffSummary;
import com.curalink.api.dto.PageResponse;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.admin.AdminStaffService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequireUserTypes(UserType.ADMIN)
public class AdminUserController {

	private final AdminStaffService adminStaffService;

	public AdminUserController(AdminStaffService adminStaffService) {
		this.adminStaffService = adminStaffService;
	}

	/**
	 * Liste paginée des médecins et nutritionnistes (une seule liste, champ {@code role}).
	 * Paramètres : {@code page} (0-based), {@code size} (max 100), {@code q} (recherche sur nom, prénom, email,
	 * téléphone, adresse, photo), {@code type} (MEDECIN | NUTRITIONNISTE, optionnel).
	 */
	@GetMapping("/staff")
	public ResponseEntity<PageResponse<StaffSummary>> listStaff(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) StaffRole type) {
		return ResponseEntity.ok(adminStaffService.listStaff(page, size, q, type));
	}

	/** Création d'un compte médecin ou nutritionniste. */
	@PostMapping("/staff")
	public ResponseEntity<CreateStaffResponse> createStaff(@Valid @RequestBody CreateStaffRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(adminStaffService.createStaff(request));
	}

	/**
	 * Liste paginée des patients. Paramètres : {@code page}, {@code size}, {@code q} (recherche sur tous les champs
	 * visibles : nom, prénom, email, téléphone, adresse, photo, date de naissance, sexe).
	 */
	@GetMapping("/patients")
	public ResponseEntity<PageResponse<PatientSummary>> listPatients(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q) {
		return ResponseEntity.ok(adminStaffService.listPatients(page, size, q));
	}

	/** Suppression d'un compte médecin ou nutritionniste. */
	@DeleteMapping("/users/{id}")
	public ResponseEntity<Void> deleteUser(
			@PathVariable Long id,
			@AuthenticationPrincipal AuthenticatedUser currentUser) {
		adminStaffService.deleteStaffAccount(id, currentUser.userId());
		return ResponseEntity.noContent().build();
	}
}
