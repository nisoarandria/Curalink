package com.curalink.api.rendezvous;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.medecin.dto.UpdateRendezVousStatusRequest;
import com.curalink.api.rendezvous.dto.CreateRendezVousRequest;
import com.curalink.api.rendezvous.dto.MedecinRendezVousResumeResponse;
import com.curalink.api.rendezvous.dto.ProposeNouveauCreneauRequest;
import com.curalink.api.rendezvous.dto.RendezVousResponse;
import com.curalink.security.AuthenticatedUser;
import com.curalink.security.RequireUserTypes;
import com.curalink.security.UserType;
import com.curalink.service.rendezvous.RendezVousService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rendezvous")
@RequireUserTypes
public class RendezVousController {

	private final RendezVousService rendezVousService;

	public RendezVousController(RendezVousService rendezVousService) {
		this.rendezVousService = rendezVousService;
	}

	/**
	 * Liste paginée des rendez-vous du médecin connecté. Par défaut, filtre sur la date du jour.
	 * Recherche optionnelle sur nom/prénom/email patient.
	 */
	@GetMapping("/medecin/me")
	@RequireUserTypes(UserType.MEDECIN)
	public ResponseEntity<PageResponse<RendezVousResponse>> listForCurrentMedecin(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) LocalDate date,
			@RequestParam(required = false) Integer month) {
		return ResponseEntity.ok(rendezVousService.listForCurrentMedecin(currentUser, page, size, q, date, month));
	}

	/**
	 * Alias du workflow existant: liste des rendez-vous du medecin cible (doit etre le medecin connecte),
	 * filtre date optionnel (defaut: aujourd'hui), recherche patient et pagination.
	 */
	@GetMapping("/medecins/{medecinId}/rendezvous")
	@RequireUserTypes(UserType.MEDECIN)
	public ResponseEntity<PageResponse<RendezVousResponse>> listForMedecinByDate(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long medecinId,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) LocalDate date,
			@RequestParam(required = false) Integer month) {
		return ResponseEntity.ok(rendezVousService.listForMedecinId(currentUser, medecinId, page, size, q, date, month));
	}

	@GetMapping("/medecins/{medecinId}/rendezvous/resume")
	@RequireUserTypes(UserType.MEDECIN)
	public ResponseEntity<MedecinRendezVousResumeResponse> getMedecinRendezVousResume(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long medecinId) {
		return ResponseEntity.ok(rendezVousService.getResumeForMedecin(currentUser, medecinId));
	}

	/** Création d'un rendez-vous par un patient (statut par défaut = EN_ATTENTE). */
	@PostMapping
	@RequireUserTypes(UserType.PATIENT)
	public ResponseEntity<RendezVousResponse> createByPatient(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@Valid @RequestBody CreateRendezVousRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(rendezVousService.createByPatient(currentUser, request));
	}

	/** Le médecin propose un créneau (EN_ATTENTE -> PROPOSE). */
	@PatchMapping("/{id}/proposer")
	@RequireUserTypes(UserType.MEDECIN)
	public ResponseEntity<RendezVousResponse> proposer(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		return ResponseEntity.ok(rendezVousService.proposer(currentUser, id));
	}

	/** Le médecin propose une nouvelle date/heure (EN_ATTENTE|PROPOSE -> PROPOSE). */
	@PatchMapping("/{id}/proposer-creneau")
	@RequireUserTypes(UserType.MEDECIN)
	public ResponseEntity<RendezVousResponse> proposerNouveauCreneau(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id,
			@Valid @RequestBody ProposeNouveauCreneauRequest request) {
		return ResponseEntity.ok(rendezVousService.proposerNouveauCreneau(currentUser, id, request.dateHeure()));
	}

	/** Confirmation du rendez-vous (PROPOSE -> CONFIRME) par patient ou médecin concerné. */
	@PatchMapping("/{id}/confirmer")
	@RequireUserTypes({ UserType.PATIENT, UserType.MEDECIN })
	public ResponseEntity<RendezVousResponse> confirmer(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		return ResponseEntity.ok(rendezVousService.confirmer(currentUser, id));
	}

	/** Refus du créneau proposé (PROPOSE -> REFUSE) par le patient concerné. */
	@PatchMapping("/{id}/refuser")
	@RequireUserTypes(UserType.PATIENT)
	public ResponseEntity<RendezVousResponse> refuser(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		return ResponseEntity.ok(rendezVousService.refuser(currentUser, id));
	}

	/** Annulation du rendez-vous par le patient ou le médecin concerné. */
	@PatchMapping("/{id}/annuler")
	@RequireUserTypes({ UserType.PATIENT, UserType.MEDECIN })
	public ResponseEntity<RendezVousResponse> annuler(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		return ResponseEntity.ok(rendezVousService.annuler(currentUser, id));
	}

	/** Consultation effectuée (CONFIRME -> TERMINE), action du médecin concerné. */
	@PatchMapping("/{id}/terminer")
	@RequireUserTypes(UserType.MEDECIN)
	public ResponseEntity<RendezVousResponse> terminer(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		return ResponseEntity.ok(rendezVousService.terminer(currentUser, id));
	}

	/** Patient absent (CONFIRME -> ABSENT), action du médecin concerné. */
	@PatchMapping("/{id}/absent")
	@RequireUserTypes(UserType.MEDECIN)
	public ResponseEntity<RendezVousResponse> absent(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id) {
		return ResponseEntity.ok(rendezVousService.marquerAbsent(currentUser, id));
	}

	/**
	 * Cloture / mise a jour de statut du rendez-vous (medecin proprietaire).
	 */
	@PatchMapping("/{id}/status")
	@RequireUserTypes(UserType.MEDECIN)
	public ResponseEntity<RendezVousResponse> updateStatus(
			@AuthenticationPrincipal AuthenticatedUser currentUser,
			@PathVariable long id,
			@Valid @RequestBody UpdateRendezVousStatusRequest request) {
		return ResponseEntity.ok(rendezVousService.updateStatus(currentUser, id, request.status()));
	}
}
