package com.curalink.service.admin;

import com.curalink.api.admin.dto.AdminDisponibiliteResponse;
import com.curalink.api.admin.dto.PlanningValidationResponse;
import com.curalink.api.dto.PageResponse;
import com.curalink.api.rendezvous.dto.UpsertDisponibiliteRequest;
import com.curalink.model.disponibilite.Disponibilite;
import com.curalink.model.disponibilite.JourSemaine;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.User;
import com.curalink.repository.DisponibiliteRepository;
import com.curalink.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Set;

@Service
public class AdminDisponibiliteService {

	private static final int MAX_PAGE_SIZE = 100;

	private final DisponibiliteRepository disponibiliteRepository;
	private final UserRepository userRepository;

	public AdminDisponibiliteService(
			DisponibiliteRepository disponibiliteRepository,
			UserRepository userRepository) {
		this.disponibiliteRepository = disponibiliteRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public PageResponse<AdminDisponibiliteResponse> list(int page, int size, Long medecinId, LocalDate date, String q) {
		int safeSize = clampSize(size);
		Pageable pageable = PageRequest.of(page, safeSize, Sort.by("dateDebut", "heureDebut").ascending());
		String search = q == null || q.isBlank() ? null : q.trim();
		if (date == null) {
			return PageResponse.from(disponibiliteRepository.searchAdminNoDate(medecinId, search, pageable)
					.map(this::toResponse));
		}
		java.util.List<Disponibilite> filtered = disponibiliteRepository.searchAdminNoDateList(medecinId, search).stream()
				.filter(d -> !date.isBefore(d.getDateDebut()) && !date.isAfter(d.getDateFin()))
				.toList();
		int from = Math.min(page * safeSize, filtered.size());
		int to = Math.min(from + safeSize, filtered.size());
		java.util.List<AdminDisponibiliteResponse> content = filtered.subList(from, to).stream().map(this::toResponse).toList();
		int totalPages = safeSize == 0 ? 0 : (int) Math.ceil((double) filtered.size() / safeSize);
		return new PageResponse<>(content, page, safeSize, filtered.size(), totalPages);
	}

	@Transactional
	public AdminDisponibiliteResponse create(long medecinId, UpsertDisponibiliteRequest request) {
		Medecin medecin = requireMedecin(medecinId);
		NormalizedRule rule = normalizeAndValidate(request);
		ensureNoConflict(medecin.getId(), rule, null);

		Disponibilite saved = disponibiliteRepository.save(new Disponibilite(
				medecin,
				rule.dateDebut(),
				rule.dateFin(),
				rule.joursSemaine(),
				rule.heureDebut(),
				rule.heureFin()));
		return toResponse(saved);
	}

	@Transactional
	public AdminDisponibiliteResponse update(long disponibiliteId, UpsertDisponibiliteRequest request) {
		Disponibilite existing = disponibiliteRepository.findById(disponibiliteId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Disponibilité introuvable"));
		NormalizedRule rule = normalizeAndValidate(request);
		ensureNoConflict(existing.getMedecin().getId(), rule, disponibiliteId);

		existing.setDateDebut(rule.dateDebut());
		existing.setDateFin(rule.dateFin());
		existing.setJoursSemaine(rule.joursSemaine());
		existing.setHeureDebut(rule.heureDebut());
		existing.setHeureFin(rule.heureFin());
		existing.setPlanningValide(false);
		return toResponse(existing);
	}

	@Transactional
	public void delete(long disponibiliteId) {
		Disponibilite existing = disponibiliteRepository.findById(disponibiliteId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Disponibilité introuvable"));
		disponibiliteRepository.delete(existing);
	}

	@Transactional
	public AdminDisponibiliteResponse validateOne(long disponibiliteId) {
		Disponibilite existing = disponibiliteRepository.findById(disponibiliteId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Disponibilité introuvable"));
		existing.setPlanningValide(true);
		return toResponse(existing);
	}

	@Transactional
	public PlanningValidationResponse validateByMedecin(long medecinId) {
		requireMedecin(medecinId);
		int updated = disponibiliteRepository.validateAllByMedecin(medecinId);
		return new PlanningValidationResponse(medecinId, updated, "Plannings validés");
	}

	private Medecin requireMedecin(Long medecinId) {
		User user = userRepository.findById(medecinId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Médecin introuvable"));
		if (!(user instanceof Medecin medecin)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'utilisateur ciblé n'est pas un médecin");
		}
		return medecin;
	}

	private void ensureNoConflict(Long medecinId, NormalizedRule rule, Long excludeId) {
		boolean conflict = disponibiliteRepository.findPotentialConflicts(
						medecinId, rule.dateDebut(), rule.dateFin()).stream()
				.filter(existing -> excludeId == null || !existing.getId().equals(excludeId))
				.anyMatch(existing -> rulesConflict(existing, rule));
		if (conflict) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce créneau chevauche une disponibilité existante");
		}
	}

	private static NormalizedRule normalizeAndValidate(UpsertDisponibiliteRequest request) {
		if (!request.heureFin().isAfter(request.heureDebut())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'heure de fin doit être strictement après l'heure de début");
		}
		if (request.date() != null) {
			Set<JourSemaine> daySet = Set.of(toJourSemaine(request.date()));
			return new NormalizedRule(request.date(), request.date(), daySet, request.heureDebut(), request.heureFin());
		}
		if (request.dateDebut() == null || request.dateFin() == null || request.joursSemaine() == null
				|| request.joursSemaine().isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Renseignez soit 'date' (saisie unitaire), soit 'dateDebut', 'dateFin' et 'joursSemaine'");
		}
		if (request.dateFin().isBefore(request.dateDebut())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dateFin doit être >= dateDebut");
		}
		return new NormalizedRule(
				request.dateDebut(),
				request.dateFin(),
				request.joursSemaine(),
				request.heureDebut(),
				request.heureFin());
	}

	private static boolean rulesConflict(Disponibilite existing, NormalizedRule incoming) {
		boolean timeOverlap = existing.getHeureDebut().isBefore(incoming.heureFin())
				&& existing.getHeureFin().isAfter(incoming.heureDebut());
		if (!timeOverlap) {
			return false;
		}
		Set<JourSemaine> overlapDays = existing.getJoursSemaine().stream()
				.filter(incoming.joursSemaine()::contains)
				.collect(java.util.stream.Collectors.toSet());
		if (overlapDays.isEmpty()) {
			return false;
		}
		LocalDate start = max(existing.getDateDebut(), incoming.dateDebut());
		LocalDate end = min(existing.getDateFin(), incoming.dateFin());
		if (end.isBefore(start)) {
			return false;
		}
		for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
			if (overlapDays.contains(toJourSemaine(date))) {
				return true;
			}
		}
		return false;
	}

	private static LocalDate max(LocalDate a, LocalDate b) {
		return a.isAfter(b) ? a : b;
	}

	private static LocalDate min(LocalDate a, LocalDate b) {
		return a.isBefore(b) ? a : b;
	}

	private static JourSemaine toJourSemaine(LocalDate date) {
		return switch (date.getDayOfWeek()) {
			case MONDAY -> JourSemaine.LUN;
			case TUESDAY -> JourSemaine.MAR;
			case WEDNESDAY -> JourSemaine.MER;
			case THURSDAY -> JourSemaine.JEU;
			case FRIDAY -> JourSemaine.VEN;
			case SATURDAY -> JourSemaine.SAM;
			case SUNDAY -> JourSemaine.DIM;
		};
	}

	private static int clampSize(int size) {
		return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
	}

	private AdminDisponibiliteResponse toResponse(Disponibilite d) {
		String fullName = d.getMedecin().getPrenom() + " " + d.getMedecin().getNom();
		return new AdminDisponibiliteResponse(
				d.getId(),
				d.getMedecin().getId(),
				fullName,
				d.getMedecin().getEmail(),
				d.getDateDebut(),
				d.getDateFin(),
				d.getJoursSemaine(),
				d.getHeureDebut(),
				d.getHeureFin(),
				d.isPlanningValide());
	}

	private record NormalizedRule(
			LocalDate dateDebut,
			LocalDate dateFin,
			Set<JourSemaine> joursSemaine,
			java.time.LocalTime heureDebut,
			java.time.LocalTime heureFin) {
	}
}
