package com.curalink.api.rendezvous;

import com.curalink.api.rendezvous.dto.MedecinDisponibiliteResponse;
import com.curalink.api.rendezvous.dto.MedecinOptionResponse;
import com.curalink.api.rendezvous.dto.ServiceDisponibiliteResponse;
import com.curalink.api.rendezvous.dto.ServiceOptionResponse;
import com.curalink.service.rendezvous.DisponibiliteQueryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
public class DisponibiliteController {

	private final DisponibiliteQueryService disponibiliteQueryService;

	public DisponibiliteController(DisponibiliteQueryService disponibiliteQueryService) {
		this.disponibiliteQueryService = disponibiliteQueryService;
	}

	@GetMapping("/services")
	public ResponseEntity<List<ServiceOptionResponse>> listServices() {
		return ResponseEntity.ok(disponibiliteQueryService.listServices());
	}

	@GetMapping("/services/{serviceId}/medecins")
	public ResponseEntity<List<MedecinOptionResponse>> listMedecinsByService(@PathVariable long serviceId) {
		return ResponseEntity.ok(disponibiliteQueryService.listMedecinsByService(serviceId));
	}

	@GetMapping("/medecins/{medecinId}/disponibilites")
	public ResponseEntity<List<MedecinDisponibiliteResponse>> listDisponibilitesByMedecin(@PathVariable long medecinId) {
		return ResponseEntity.ok(disponibiliteQueryService.listDisponibilitesByMedecin(medecinId));
	}

	@GetMapping("/services/{serviceId}/disponibilites")
	public ResponseEntity<List<ServiceDisponibiliteResponse>> listDisponibilitesByServiceAndDate(
			@PathVariable long serviceId,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return ResponseEntity.ok(disponibiliteQueryService.listDisponibilitesByServiceAndDate(serviceId, date));
	}
}
