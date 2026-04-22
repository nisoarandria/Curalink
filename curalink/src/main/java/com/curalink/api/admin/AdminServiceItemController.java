package com.curalink.api.admin;

import com.curalink.api.admin.dto.ServiceItemResponse;
import com.curalink.api.dto.PageResponse;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.admin.AdminServiceItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/services")
@RequireUserTypes(UserType.ADMIN)
public class AdminServiceItemController {

	private final AdminServiceItemService adminServiceItemService;

	public AdminServiceItemController(AdminServiceItemService adminServiceItemService) {
		this.adminServiceItemService = adminServiceItemService;
	}

	@GetMapping
	public ResponseEntity<PageResponse<ServiceItemResponse>> list(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return ResponseEntity.ok(adminServiceItemService.list(page, size));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ServiceItemResponse> get(@PathVariable long id) {
		return ResponseEntity.ok(adminServiceItemService.getById(id));
	}

	/**
	 * Création : {@code multipart/form-data} avec parties {@code nom}, {@code description} (optionnel),
	 * {@code illustration} (fichier image).
	 */
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ServiceItemResponse> create(
			@RequestPart("nom") String nom,
			@RequestPart(value = "description", required = false) String description,
			@RequestPart("illustration") MultipartFile illustration) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(adminServiceItemService.create(nom, description, illustration));
	}

	/**
	 * Mise à jour : mêmes parties ; {@code illustration} optionnel (conserve l’existante si absente).
	 */
	@PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ServiceItemResponse> update(
			@PathVariable long id,
			@RequestPart("nom") String nom,
			@RequestPart(value = "description", required = false) String description,
			@RequestPart(value = "illustration", required = false) MultipartFile illustration) {
		return ResponseEntity.ok(adminServiceItemService.update(id, nom, description, illustration));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable long id) {
		adminServiceItemService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
