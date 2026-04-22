package com.curalink.service.rendezvous;

import com.curalink.api.rendezvous.dto.DisponibiliteDetailResponse;
import com.curalink.api.rendezvous.dto.UpsertDisponibiliteRequest;
import com.curalink.model.disponibilite.Disponibilite;
import com.curalink.model.disponibilite.JourSemaine;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.User;
import com.curalink.repository.DisponibiliteRepository;
import com.curalink.repository.UserRepository;
import com.curalink.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class MedecinDisponibiliteCrudService {

	private final DisponibiliteRepository disponibiliteRepository;
	private final UserRepository userRepository;

	public MedecinDisponibiliteCrudService(
			DisponibiliteRepository disponibiliteRepository,
			UserRepository userRepository) {
		this.disponibiliteRepository = disponibiliteRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<DisponibiliteDetailResponse> listMine(AuthenticatedUser currentUser) {
		Medecin medecin = requireMedecin(currentUser);
		return disponibiliteRepository.findByMedecinIdOrderByDateDebutAscHeureDebutAsc(medecin.getId()).stream()
				.map(this::toDetailResponse)
				.toList();
	}

	@Transactional
	public DisponibiliteDetailResponse createMine(AuthenticatedUser currentUser, UpsertDisponibiliteRequest request) {
		Medecin medecin = requireMedecin(currentUser);
		NormalizedRule rule = normalizeAndValidate(request);
		ensureNoConflict(medecin.getId(), rule, null);

		Disponibilite saved = disponibiliteRepository.save(new Disponibilite(
				medecin,
				rule.dateDebut(),
				rule.dateFin(),
				rule.joursSemaine(),
				rule.heureDebut(),
				rule.heureFin()));
		return toDetailResponse(saved);
	}

	@Transactional
	public DisponibiliteDetailResponse updateMine(
			AuthenticatedUser currentUser,
			long disponibiliteId,
			UpsertDisponibiliteRequest request) {
		Medecin medecin = requireMedecin(currentUser);
		NormalizedRule rule = normalizeAndValidate(request);
		ensureNoConflict(medecin.getId(), rule, disponibiliteId);

		Disponibilite d = disponibiliteRepository.findByIdAndMedecinId(disponibiliteId, medecin.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Disponibilité introuvable"));
		d.setDateDebut(rule.dateDebut());
		d.setDateFin(rule.dateFin());
		d.setJoursSemaine(rule.joursSemaine());
		d.setHeureDebut(rule.heureDebut());
		d.setHeureFin(rule.heureFin());
		d.setPlanningValide(false);
		return toDetailResponse(d);
	}

	@Transactional
	public void deleteMine(AuthenticatedUser currentUser, long disponibiliteId) {
		Medecin medecin = requireMedecin(currentUser);
		Disponibilite d = disponibiliteRepository.findByIdAndMedecinId(disponibiliteId, medecin.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Disponibilité introuvable"));
		disponibiliteRepository.delete(d);
	}

	private void ensureNoConflict(Long medecinId, NormalizedRule rule, Long excludeId) {
		boolean conflict = disponibiliteRepository.findPotentialConflicts(
						medecinId, rule.dateDebut(), rule.dateFin()).stream()
				.filter(existing -> excludeId == null || !existing.getId().equals(excludeId))
				.anyMatch(existing -> rulesConflict(existing, rule));
		if (conflict) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"Ce créneau chevauche une disponibilité existante");
		}
	}

	private static NormalizedRule normalizeAndValidate(UpsertDisponibiliteRequest request) {
		if (!request.heureFin().isAfter(request.heureDebut())) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"L'heure de fin doit être strictement après l'heure de début");
		}

		if (request.date() != null) {
			Set<JourSemaine> daySet = Set.of(toJourSemaine(request.date()));
			return new NormalizedRule(request.date(), request.date(), daySet, request.heureDebut(), request.heureFin());
		}

		if (request.dateDebut() == null || request.dateFin() == null || request.joursSemaine() == null
				|| request.joursSemaine().isEmpty()) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
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
			JourSemaine js = toJourSemaine(date);
			if (overlapDays.contains(js)) {
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

	private Medecin requireMedecin(AuthenticatedUser currentUser) {
		User user = userRepository.findById(currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(user instanceof Medecin medecin)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action réservée aux médecins");
		}
		return medecin;
	}

	private DisponibiliteDetailResponse toDetailResponse(Disponibilite d) {
		return new DisponibiliteDetailResponse(
				d.getId(),
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
