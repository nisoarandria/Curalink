package com.curalink.service.patient;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.medecin.dto.AntecedentResponse;
import com.curalink.api.medecin.dto.ConstanteVitaleResponse;
import com.curalink.api.medecin.dto.ConsultationResponse;
import com.curalink.api.patient.dto.PatientOrdonnanceResponse;
import com.curalink.api.patient.dto.PatientProfileResponse;
import com.curalink.api.rendezvous.dto.RendezVousResponse;
import com.curalink.model.consultation.Consultation;
import com.curalink.model.consultation.Ordonnance;
import com.curalink.model.rendezvous.RendezVous;
import com.curalink.model.user.Patient;
import com.curalink.model.user.User;
import com.curalink.repository.AntecedentMedicalRepository;
import com.curalink.repository.ConsultationRepository;
import com.curalink.repository.ConstanteVitaleRepository;
import com.curalink.repository.OrdonnanceRepository;
import com.curalink.repository.RendezVousRepository;
import com.curalink.repository.UserRepository;
import com.curalink.security.AuthenticatedUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class PatientPortalService {

	private static final int MAX_PAGE_SIZE = 100;

	private final UserRepository userRepository;
	private final OrdonnanceRepository ordonnanceRepository;
	private final RendezVousRepository rendezVousRepository;
	private final AntecedentMedicalRepository antecedentMedicalRepository;
	private final ConstanteVitaleRepository constanteVitaleRepository;
	private final ConsultationRepository consultationRepository;

	public PatientPortalService(
			UserRepository userRepository,
			OrdonnanceRepository ordonnanceRepository,
			RendezVousRepository rendezVousRepository,
			AntecedentMedicalRepository antecedentMedicalRepository,
			ConstanteVitaleRepository constanteVitaleRepository,
			ConsultationRepository consultationRepository) {
		this.userRepository = userRepository;
		this.ordonnanceRepository = ordonnanceRepository;
		this.rendezVousRepository = rendezVousRepository;
		this.antecedentMedicalRepository = antecedentMedicalRepository;
		this.constanteVitaleRepository = constanteVitaleRepository;
		this.consultationRepository = consultationRepository;
	}

	@Transactional(readOnly = true)
	public PatientProfileResponse getMyProfile(AuthenticatedUser currentUser) {
		Patient patient = requireCurrentPatient(currentUser);
		return toPatientProfileResponse(patient);
	}

	@Transactional(readOnly = true)
	public List<AntecedentResponse> listMyAntecedents(AuthenticatedUser currentUser) {
		Patient patient = requireCurrentPatient(currentUser);
		return antecedentMedicalRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
				.map(a -> new AntecedentResponse(
						a.getId(),
						a.getPatient().getId(),
						a.getDescription(),
						a.getCreatedAt()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<ConstanteVitaleResponse> listMyConstantes(AuthenticatedUser currentUser) {
		Patient patient = requireCurrentPatient(currentUser);
		return constanteVitaleRepository.findByPatientIdOrderByDateDescIdDesc(patient.getId()).stream()
				.map(c -> new ConstanteVitaleResponse(
						c.getId(),
						c.getPatient().getId(),
						c.getDate(),
						c.getGlycemie(),
						c.getTension(),
						c.getPoids(),
						c.getImc()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<ConsultationResponse> listMyConsultations(AuthenticatedUser currentUser) {
		Patient patient = requireCurrentPatient(currentUser);
		return consultationRepository.findByPatientIdOrderByDateDescIdDesc(patient.getId()).stream()
				.map(PatientPortalService::toConsultationResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public PageResponse<PatientOrdonnanceResponse> listMyOrdonnances(
			AuthenticatedUser currentUser,
			int page,
			int size,
			String q,
			LocalDate date) {
		Patient patient = requireCurrentPatient(currentUser);
		String search = (q == null || q.isBlank()) ? null : q.trim().toLowerCase(Locale.ROOT);
		List<Ordonnance> base = (date == null)
				? ordonnanceRepository.findAllByPatientId(patient.getId())
				: ordonnanceRepository.findAllByPatientIdAndConsultationDate(patient.getId(), date);
		List<Ordonnance> filtered;
		if (search == null) {
			filtered = base;
		} else {
			filtered = base.stream().filter(o -> matchesSearch(o, search)).toList();
		}
		int safeSize = clampSize(size);
		int from = Math.min(page * safeSize, filtered.size());
		int to = Math.min(from + safeSize, filtered.size());
		List<PatientOrdonnanceResponse> content = filtered.subList(from, to).stream()
				.map(this::toPatientOrdonnanceResponse)
				.toList();
		int totalPages = safeSize == 0 ? 0 : (int) Math.ceil((double) filtered.size() / safeSize);
		return new PageResponse<>(content, page, safeSize, filtered.size(), totalPages);
	}

	@Transactional(readOnly = true)
	public byte[] downloadMyOrdonnancePdf(AuthenticatedUser currentUser, long ordonnanceId) {
		Patient patient = requireCurrentPatient(currentUser);
		Ordonnance ordonnance = ordonnanceRepository.findByIdAndPatientId(ordonnanceId, patient.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ordonnance introuvable"));
		return ordonnance.getPdfContent();
	}

	@Transactional(readOnly = true)
	public PageResponse<RendezVousResponse> listMyRendezVous(
			AuthenticatedUser currentUser,
			int page,
			int size,
			String q,
			LocalDate date) {
		Patient patient = requireCurrentPatient(currentUser);
		String search = (q == null || q.isBlank()) ? "" : q.trim();
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.ASC, "dateHeure"));
		if (date == null) {
			return PageResponse.from(rendezVousRepository.searchForPatientNoDate(
					patient.getId(),
					search,
					pageable).map(PatientPortalService::toRendezVousResponse));
		}
		LocalDateTime start = date.atStartOfDay();
		LocalDateTime end = date.plusDays(1).atStartOfDay();
		return PageResponse.from(rendezVousRepository.searchForPatientByDate(
				patient.getId(),
				start,
				end,
				search,
				pageable).map(PatientPortalService::toRendezVousResponse));
	}

	private Patient requireCurrentPatient(AuthenticatedUser currentUser) {
		User user = userRepository.findById(currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(user instanceof Patient patient)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action reservee aux patients");
		}
		return patient;
	}

	private PatientOrdonnanceResponse toPatientOrdonnanceResponse(Ordonnance o) {
		Consultation c = o.getConsultation();
		return new PatientOrdonnanceResponse(
				o.getId(),
				c.getId(),
				c.getRendezVous().getId(),
				c.getMedecin().getId(),
				c.getMedecin().getPrenom() + " " + c.getMedecin().getNom(),
				c.getDate(),
				o.getCreatedAt());
	}

	private static RendezVousResponse toRendezVousResponse(RendezVous rdv) {
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

	private static boolean matchesSearch(Ordonnance o, String q) {
		String medNom = (o.getConsultation().getMedecin().getNom() + " " + o.getConsultation().getMedecin().getPrenom())
				.toLowerCase(Locale.ROOT);
		return medNom.contains(q);
	}

	private static PatientProfileResponse toPatientProfileResponse(Patient patient) {
		return new PatientProfileResponse(
				patient.getId(),
				patient.getEmail(),
				patient.getNom(),
				patient.getPrenom(),
				patient.getTelephone(),
				patient.getAdresse(),
				patient.getDateNaissance(),
				patient.getSexe());
	}

	private static ConsultationResponse toConsultationResponse(Consultation c) {
		return new ConsultationResponse(
				c.getId(),
				c.getRendezVous().getId(),
				c.getPatient().getId(),
				c.getMedecin().getId(),
				c.getMotif(),
				c.getDiagnostic(),
				c.getDate());
	}
}
