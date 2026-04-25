package com.curalink.service.rendezvous;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.rendezvous.dto.CreateRendezVousRequest;
import com.curalink.api.rendezvous.dto.MedecinRendezVousResumeResponse;
import com.curalink.api.rendezvous.dto.RendezVousResponse;
import com.curalink.model.catalog.ServiceItem;
import com.curalink.model.rendezvous.RendezVous;
import com.curalink.model.rendezvous.RendezVousStatus;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Patient;
import com.curalink.model.user.User;
import com.curalink.repository.RendezVousRepository;
import com.curalink.repository.ServiceItemRepository;
import com.curalink.repository.UserRepository;
import com.curalink.security.AuthenticatedUser;
import com.curalink.service.mail.PasswordResetMailNotifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RendezVousService {

	private static final int MAX_PAGE_SIZE = 100;

	private final RendezVousRepository rendezVousRepository;
	private final UserRepository userRepository;
	private final ServiceItemRepository serviceItemRepository;
	private final PasswordResetMailNotifier mailNotifier;

	public RendezVousService(
			RendezVousRepository rendezVousRepository,
			UserRepository userRepository,
			ServiceItemRepository serviceItemRepository,
			PasswordResetMailNotifier mailNotifier) {
		this.rendezVousRepository = rendezVousRepository;
		this.userRepository = userRepository;
		this.serviceItemRepository = serviceItemRepository;
		this.mailNotifier = mailNotifier;
	}

	@Transactional(readOnly = true)
	public PageResponse<RendezVousResponse> listForCurrentMedecin(
			AuthenticatedUser currentUser,
			int page,
			int size,
			String q,
			LocalDate date,
			Integer month) {
		User user = userRepository.findById(currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(user instanceof Medecin medecin)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action réservée aux médecins");
		}

		LocalDate effectiveDate = (date != null) ? date : LocalDate.now();
		LocalDateTime start = resolveStartDateTime(effectiveDate, month);
		LocalDateTime end = resolveEndDateTime(effectiveDate, month);
		String search = (q == null || q.isBlank()) ? "" : q.trim();

		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.ASC, "dateHeure"));
		return PageResponse.from(rendezVousRepository.searchForMedecinByDate(
				medecin.getId(),
				start,
				end,
				search,
				pageable).map(RendezVousService::toResponse));
	}

	@Transactional(readOnly = true)
	public PageResponse<RendezVousResponse> listForMedecinId(
			AuthenticatedUser currentUser,
			long medecinId,
			int page,
			int size,
			String q,
			LocalDate date,
			Integer month) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		if (medecin.getId() != medecinId) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces refuse a ce planning medecin");
		}
		LocalDate effectiveDate = (date != null) ? date : LocalDate.now();
		LocalDateTime start = resolveStartDateTime(effectiveDate, month);
		LocalDateTime end = resolveEndDateTime(effectiveDate, month);
		String search = (q == null || q.isBlank()) ? "" : q.trim();
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.ASC, "dateHeure"));
		return PageResponse.from(rendezVousRepository.searchForMedecinByDate(
				medecinId, start, end, search, pageable).map(RendezVousService::toResponse));
	}

	@Transactional(readOnly = true)
	public MedecinRendezVousResumeResponse getResumeForMedecin(
			AuthenticatedUser currentUser,
			long medecinId) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		if (medecin.getId() != medecinId) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces refuse a ce planning medecin");
		}
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime threeMonthsAgo = now.minusMonths(3);

		List<RendezVousResponse> historiques = rendezVousRepository
				.findTop5ByMedecin_IdAndStatusAndDateHeureBetweenOrderByDateHeureDesc(
						medecinId, RendezVousStatus.TERMINE, threeMonthsAgo, now)
				.stream()
				.map(RendezVousService::toResponse)
				.toList();

		List<RendezVousResponse> prochains = rendezVousRepository
				.findTop5ByMedecin_IdAndDateHeureGreaterThanEqualAndStatusNotInOrderByDateHeureAsc(
						medecinId,
						now,
						List.of(RendezVousStatus.TERMINE, RendezVousStatus.ABSENT, RendezVousStatus.ANNULE, RendezVousStatus.REFUSE))
				.stream()
				.map(RendezVousService::toResponse)
				.toList();

		return new MedecinRendezVousResumeResponse(historiques, prochains);
	}

	@Transactional
	public RendezVousResponse createByPatient(AuthenticatedUser currentUser, CreateRendezVousRequest request) {
		Patient patient = requirePatient(currentUser);
		ServiceItem service = serviceItemRepository.findById(request.serviceId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service introuvable"));
		Medecin medecin = requireMedecin(request.medecinId());

		if (medecin.getService() == null || !medecin.getService().getId().equals(service.getId())) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Le médecin sélectionné n'est pas rattaché au service indiqué");
		}

		RendezVous saved = rendezVousRepository.save(new RendezVous(
				request.dateHeure(),
				service,
				patient,
				medecin,
				RendezVousStatus.EN_ATTENTE));
		return toResponse(saved);
	}

	@Transactional
	public RendezVousResponse proposer(AuthenticatedUser currentUser, long rendezVousId) {
		RendezVous rdv = requireOwnedByMedecin(currentUser, rendezVousId);
		requireCurrentStatus(rdv, RendezVousStatus.EN_ATTENTE);
		rdv.setStatus(RendezVousStatus.PROPOSE);
		return toResponse(rdv);
	}

	@Transactional
	public RendezVousResponse proposerNouveauCreneau(
			AuthenticatedUser currentUser,
			long rendezVousId,
			LocalDateTime nouvelleDateHeure) {
		RendezVous rdv = requireOwnedByMedecin(currentUser, rendezVousId);
		if (rdv.getStatus() != RendezVousStatus.EN_ATTENTE && rdv.getStatus() != RendezVousStatus.PROPOSE) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Transition invalide: nouvelle proposition autorisee uniquement depuis EN_ATTENTE ou PROPOSE");
		}
		rdv.setDateHeure(nouvelleDateHeure);
		rdv.setStatus(RendezVousStatus.PROPOSE);
		return toResponse(rdv);
	}

	@Transactional
	public RendezVousResponse confirmer(AuthenticatedUser currentUser, long rendezVousId) {
		RendezVous rdv = requireParticipant(currentUser, rendezVousId);
		requireCurrentStatus(rdv, RendezVousStatus.PROPOSE);
		rdv.setStatus(RendezVousStatus.CONFIRME);
		mailNotifier.sendRendezVousConfirmationRecap(
				rdv.getPatient().getEmail(),
				rdv.getPatient().getPrenom(),
				rdv.getMedecin().getPrenom() + " " + rdv.getMedecin().getNom(),
				rdv.getService().getNom(),
				rdv.getDateHeure(),
				rdv.getMedecin().getAdresse());
		return toResponse(rdv);
	}

	@Transactional
	public RendezVousResponse refuser(AuthenticatedUser currentUser, long rendezVousId) {
		RendezVous rdv = requireOwnedByPatient(currentUser, rendezVousId);
		requireCurrentStatus(rdv, RendezVousStatus.PROPOSE);
		rdv.setStatus(RendezVousStatus.REFUSE);
		return toResponse(rdv);
	}

	@Transactional
	public RendezVousResponse annuler(AuthenticatedUser currentUser, long rendezVousId) {
		RendezVous rdv = requireParticipant(currentUser, rendezVousId);
		if (rdv.getStatus() == RendezVousStatus.TERMINE || rdv.getStatus() == RendezVousStatus.ABSENT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un rendez-vous clôturé ne peut plus être annulé");
		}
		rdv.setStatus(RendezVousStatus.ANNULE);
		return toResponse(rdv);
	}

	@Transactional
	public RendezVousResponse terminer(AuthenticatedUser currentUser, long rendezVousId) {
		RendezVous rdv = requireOwnedByMedecin(currentUser, rendezVousId);
		requireCurrentStatus(rdv, RendezVousStatus.CONFIRME);
		rdv.setStatus(RendezVousStatus.TERMINE);
		return toResponse(rdv);
	}

	@Transactional
	public RendezVousResponse marquerAbsent(AuthenticatedUser currentUser, long rendezVousId) {
		RendezVous rdv = requireOwnedByMedecin(currentUser, rendezVousId);
		requireCurrentStatus(rdv, RendezVousStatus.CONFIRME);
		rdv.setStatus(RendezVousStatus.ABSENT);
		return toResponse(rdv);
	}

	@Transactional
	public RendezVousResponse updateStatus(AuthenticatedUser currentUser, long rendezVousId, RendezVousStatus status) {
		RendezVous rdv = requireOwnedByMedecin(currentUser, rendezVousId);
		rdv.setStatus(status);
		return toResponse(rdv);
	}

	private Patient requirePatient(AuthenticatedUser currentUser) {
		User user = userRepository.findById(currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(user instanceof Patient patient)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action réservée aux patients");
		}
		return patient;
	}

	private Medecin requireCurrentMedecin(AuthenticatedUser currentUser) {
		User user = userRepository.findById(currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(user instanceof Medecin medecin)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action reservee aux medecins");
		}
		return medecin;
	}

	private Medecin requireMedecin(long medecinId) {
		User user = userRepository.findById(medecinId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Médecin introuvable"));
		if (!(user instanceof Medecin medecin)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'utilisateur indiqué n'est pas un médecin");
		}
		return medecin;
	}

	private RendezVous requireOwnedByPatient(AuthenticatedUser currentUser, long rendezVousId) {
		Patient patient = requirePatient(currentUser);
		RendezVous rdv = findById(rendezVousId);
		if (!rdv.getPatient().getId().equals(patient.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce rendez-vous n'appartient pas à ce patient");
		}
		return rdv;
	}

	private RendezVous requireOwnedByMedecin(AuthenticatedUser currentUser, long rendezVousId) {
		User user = userRepository.findById(currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(user instanceof Medecin medecin)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action réservée aux médecins");
		}
		RendezVous rdv = findById(rendezVousId);
		if (!rdv.getMedecin().getId().equals(medecin.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce rendez-vous n'appartient pas à ce médecin");
		}
		return rdv;
	}

	private RendezVous requireParticipant(AuthenticatedUser currentUser, long rendezVousId) {
		RendezVous rdv = findById(rendezVousId);
		Long currentUserId = currentUser.userId();
		boolean isPatient = rdv.getPatient().getId().equals(currentUserId);
		boolean isMedecin = rdv.getMedecin().getId().equals(currentUserId);
		if (!isPatient && !isMedecin) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à ce rendez-vous");
		}
		return rdv;
	}

	private RendezVous findById(long rendezVousId) {
		return rendezVousRepository.findById(rendezVousId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rendez-vous introuvable"));
	}

	private static void requireCurrentStatus(RendezVous rdv, RendezVousStatus expected) {
		if (rdv.getStatus() != expected) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Transition de statut invalide: statut actuel = " + rdv.getStatus());
		}
	}

	private static RendezVousResponse toResponse(RendezVous rdv) {
		return new RendezVousResponse(
				rdv.getId(),
				rdv.getDateHeure(),
				rdv.getStatus(),
				rdv.getService().getId(),
				rdv.getService().getNom(),
				rdv.getPatient().getId(),
				rdv.getPatient().getPrenom() + " " + rdv.getPatient().getNom(),
				rdv.getMedecin().getId(),
				rdv.getMedecin().getPrenom() + " " + rdv.getMedecin().getNom(),
				rdv.getService().getNom(),
				rdv.getMedecin().getAdresse(),
				rdv.getMedecin().getNumeroInscription());
	}

	private static int clampSize(int size) {
		return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
	}

	private static LocalDateTime resolveStartDateTime(LocalDate effectiveDate, Integer month) {
		if (month == null) {
			return effectiveDate.atStartOfDay();
		}
		validateMonth(month);
		LocalDate firstDay = LocalDate.of(LocalDate.now().getYear(), month, 1);
		return firstDay.atStartOfDay();
	}

	private static LocalDateTime resolveEndDateTime(LocalDate effectiveDate, Integer month) {
		if (month == null) {
			return effectiveDate.plusDays(1).atStartOfDay();
		}
		validateMonth(month);
		LocalDate firstDay = LocalDate.of(LocalDate.now().getYear(), month, 1);
		return firstDay.plusMonths(1).atStartOfDay();
	}

	private static void validateMonth(Integer month) {
		if (month < 1 || month > 12) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le parametre month doit etre compris entre 1 et 12");
		}
	}
}
