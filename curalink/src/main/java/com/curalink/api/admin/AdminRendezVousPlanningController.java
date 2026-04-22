package com.curalink.api.admin;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.rendezvous.dto.RendezVousResponse;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.admin.AdminRendezVousPlanningService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/rendezvous")
@RequireUserTypes(UserType.ADMIN)
public class AdminRendezVousPlanningController {

	private final AdminRendezVousPlanningService adminRendezVousPlanningService;

	public AdminRendezVousPlanningController(AdminRendezVousPlanningService adminRendezVousPlanningService) {
		this.adminRendezVousPlanningService = adminRendezVousPlanningService;
	}

	@GetMapping("/planning")
	public ResponseEntity<PageResponse<RendezVousResponse>> listGlobalPlanning(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) Long medecinId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return ResponseEntity.ok(adminRendezVousPlanningService.listGlobalPlanning(page, size, q, medecinId, date));
	}
}
