package com.curalink.service.medecin;

import com.curalink.api.medecin.dto.AntecedentResponse;
import com.curalink.api.medecin.dto.ConstanteVitaleResponse;
import com.curalink.api.medecin.dto.ConsultationResponse;
import com.curalink.api.medecin.dto.CreateAntecedentRequest;
import com.curalink.api.medecin.dto.CreateConstanteVitaleRequest;
import com.curalink.api.medecin.dto.CreateConsultationRequest;
import com.curalink.api.medecin.dto.OrdonnanceResponse;
import com.curalink.model.consultation.AntecedentMedical;
import com.curalink.model.consultation.Consultation;
import com.curalink.model.consultation.ConstanteVitale;
import com.curalink.model.consultation.Ordonnance;
import com.curalink.model.rendezvous.RendezVous;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Patient;
import com.curalink.model.user.User;
import com.curalink.repository.AntecedentMedicalRepository;
import com.curalink.repository.ConsultationRepository;
import com.curalink.repository.ConstanteVitaleRepository;
import com.curalink.repository.OrdonnanceRepository;
import com.curalink.repository.PatientRepository;
import com.curalink.repository.RendezVousRepository;
import com.curalink.repository.UserRepository;
import com.curalink.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MedecinConsultationService {

	private final ConsultationRepository consultationRepository;
	private final ConstanteVitaleRepository constanteVitaleRepository;
	private final AntecedentMedicalRepository antecedentMedicalRepository;
	private final OrdonnanceRepository ordonnanceRepository;
	private final RendezVousRepository rendezVousRepository;
	private final UserRepository userRepository;
	private final PatientRepository patientRepository;

	public MedecinConsultationService(
			ConsultationRepository consultationRepository,
			ConstanteVitaleRepository constanteVitaleRepository,
			AntecedentMedicalRepository antecedentMedicalRepository,
			OrdonnanceRepository ordonnanceRepository,
			RendezVousRepository rendezVousRepository,
			UserRepository userRepository,
			PatientRepository patientRepository) {
		this.consultationRepository = consultationRepository;
		this.constanteVitaleRepository = constanteVitaleRepository;
		this.antecedentMedicalRepository = antecedentMedicalRepository;
		this.ordonnanceRepository = ordonnanceRepository;
		this.rendezVousRepository = rendezVousRepository;
		this.userRepository = userRepository;
		this.patientRepository = patientRepository;
	}

	@Transactional
	public ConsultationResponse createConsultation(AuthenticatedUser currentUser, CreateConsultationRequest request) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		if (!medecin.getId().equals(request.medecinId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Le medecin du body doit etre le medecin connecte");
		}

		RendezVous rdv = rendezVousRepository.findById(request.rendezVousId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rendez-vous introuvable"));
		if (!rdv.getMedecin().getId().equals(medecin.getId()) || !rdv.getPatient().getId().equals(request.patientId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le rendez-vous ne correspond pas aux identifiants fournis");
		}

		Consultation saved = consultationRepository.save(new Consultation(
				rdv,
				rdv.getPatient(),
				medecin,
				request.motif().trim(),
				request.diagnostic().trim(),
				request.date()));
		return toResponse(saved);
	}

	@Transactional
	public ConstanteVitaleResponse addConstanteForPatient(
			AuthenticatedUser currentUser,
			long patientId,
			CreateConstanteVitaleRequest request) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		assertPatientLinkedToMedecin(medecin.getId(), patientId);
		Patient patient = requirePatient(patientId);
		ConstanteVitale saved = constanteVitaleRepository.save(new ConstanteVitale(
				patient,
				request.date(),
				request.glycemie(),
				request.tension(),
				request.poids(),
				request.imc()));
		return new ConstanteVitaleResponse(
				saved.getId(),
				saved.getPatient().getId(),
				saved.getDate(),
				saved.getGlycemie(),
				saved.getTension(),
				saved.getPoids(),
				saved.getImc());
	}

	@Transactional(readOnly = true)
	public List<AntecedentResponse> listAntecedents(AuthenticatedUser currentUser, long patientId) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		assertPatientLinkedToMedecin(medecin.getId(), patientId);
		return antecedentMedicalRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
				.map(a -> new AntecedentResponse(a.getId(), a.getPatient().getId(), a.getDescription(), a.getCreatedAt()))
				.toList();
	}

	@Transactional
	public AntecedentResponse addAntecedent(AuthenticatedUser currentUser, long patientId, CreateAntecedentRequest request) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		assertPatientLinkedToMedecin(medecin.getId(), patientId);
		Patient patient = requirePatient(patientId);
		AntecedentMedical saved = antecedentMedicalRepository.save(new AntecedentMedical(
				patient,
				request.description().trim(),
				LocalDateTime.now()));
		return new AntecedentResponse(saved.getId(), patientId, saved.getDescription(), saved.getCreatedAt());
	}

	@Transactional
	public OrdonnanceResponse createOrdonnance(
			AuthenticatedUser currentUser,
			long consultationId,
			MultipartFile pdfContent) {
		Consultation consultation = consultationRepository.findById(consultationId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation introuvable"));
		assertOwnerMedecin(currentUser, consultation.getMedecin().getId());

		ordonnanceRepository.findByConsultationId(consultationId).ifPresent(existing -> {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Une ordonnance existe deja pour cette consultation");
		});
		validatePdfFile(pdfContent);
		byte[] pdfBytes;
		try {
			pdfBytes = pdfContent.getBytes();
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lecture du fichier PDF impossible");
		}
		Ordonnance saved = ordonnanceRepository.save(new Ordonnance(
				consultation,
				pdfBytes,
				LocalDateTime.now()));

		return new OrdonnanceResponse(
				saved.getId(),
				consultationId,
				saved.getCreatedAt(),
				"Ordonnance PDF recue et enregistree");
	}

	@Transactional(readOnly = true)
	public List<ConstanteVitaleResponse> listConstantesByPatient(AuthenticatedUser currentUser, long patientId) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		assertPatientLinkedToMedecin(medecin.getId(), patientId);
		return constanteVitaleRepository.findByPatientIdOrderByDateDescIdDesc(patientId)
				.stream()
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
	public List<ConsultationResponse> listConsultationsByPatient(AuthenticatedUser currentUser, long patientId) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		assertPatientLinkedToMedecin(medecin.getId(), patientId);
		return consultationRepository.findByPatientIdAndMedecinIdOrderByDateDescIdDesc(patientId, medecin.getId())
				.stream()
				.map(MedecinConsultationService::toResponse)
				.toList();
	}

	private Medecin requireCurrentMedecin(AuthenticatedUser currentUser) {
		User user = userRepository.findById(currentUser.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
		if (!(user instanceof Medecin medecin)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action reservee aux medecins");
		}
		return medecin;
	}

	private void assertOwnerMedecin(AuthenticatedUser currentUser, long medecinId) {
		Medecin medecin = requireCurrentMedecin(currentUser);
		if (medecin.getId() != medecinId) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette ressource n'appartient pas au medecin connecte");
		}
	}

	private Patient requirePatient(long patientId) {
		User user = userRepository.findById(patientId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable"));
		if (!(user instanceof Patient patient)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'utilisateur cible n'est pas un patient");
		}
		return patient;
	}

	private void assertPatientLinkedToMedecin(long medecinId, long patientId) {
		if (!patientRepository.existsById(patientId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable");
		}
		if (!patientRepository.existsLinkedToMedecin(patientId, medecinId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce patient n'est pas rattache au medecin connecte");
		}
	}

	private static ConsultationResponse toResponse(Consultation c) {
		return new ConsultationResponse(
				c.getId(),
				c.getRendezVous().getId(),
				c.getPatient().getId(),
				c.getMedecin().getId(),
				c.getMotif(),
				c.getDiagnostic(),
				c.getDate());
	}

	private static void validatePdfFile(MultipartFile pdfContent) {
		if (pdfContent == null || pdfContent.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier PDF de l'ordonnance est requis");
		}
		String contentType = pdfContent.getContentType();
		if (contentType != null && !"application/pdf".equalsIgnoreCase(contentType)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier doit être un PDF");
		}
	}
}
