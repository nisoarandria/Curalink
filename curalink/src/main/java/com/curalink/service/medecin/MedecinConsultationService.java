package com.curalink.service.medecin;

import com.curalink.api.medecin.dto.AntecedentResponse;
import com.curalink.api.medecin.dto.ConstanteVitaleResponse;
import com.curalink.api.medecin.dto.ConsultationResponse;
import com.curalink.api.medecin.dto.CreateAntecedentRequest;
import com.curalink.api.medecin.dto.CreateConstanteVitaleRequest;
import com.curalink.api.medecin.dto.CreateConsultationRequest;
import com.curalink.api.medecin.dto.CreateOrdonnanceRequest;
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
import com.curalink.repository.RendezVousRepository;
import com.curalink.repository.UserRepository;
import com.curalink.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
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

	public MedecinConsultationService(
			ConsultationRepository consultationRepository,
			ConstanteVitaleRepository constanteVitaleRepository,
			AntecedentMedicalRepository antecedentMedicalRepository,
			OrdonnanceRepository ordonnanceRepository,
			RendezVousRepository rendezVousRepository,
			UserRepository userRepository) {
		this.consultationRepository = consultationRepository;
		this.constanteVitaleRepository = constanteVitaleRepository;
		this.antecedentMedicalRepository = antecedentMedicalRepository;
		this.ordonnanceRepository = ordonnanceRepository;
		this.rendezVousRepository = rendezVousRepository;
		this.userRepository = userRepository;
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
	public ConstanteVitaleResponse addConstante(
			AuthenticatedUser currentUser,
			long consultationId,
			CreateConstanteVitaleRequest request) {
		Consultation consultation = consultationRepository.findById(consultationId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation introuvable"));
		assertOwnerMedecin(currentUser, consultation.getMedecin().getId());

		ConstanteVitale saved = constanteVitaleRepository.save(new ConstanteVitale(
				consultation,
				consultation.getPatient(),
				request.date(),
				request.glycemie(),
				request.tension(),
				request.poids(),
				request.imc()));
		return new ConstanteVitaleResponse(
				saved.getId(),
				consultation.getId(),
				saved.getPatient().getId(),
				saved.getDate(),
				saved.getGlycemie(),
				saved.getTension(),
				saved.getPoids(),
				saved.getImc());
	}

	@Transactional(readOnly = true)
	public List<AntecedentResponse> listAntecedents(AuthenticatedUser currentUser, long patientId) {
		requireCurrentMedecin(currentUser);
		return antecedentMedicalRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
				.map(a -> new AntecedentResponse(a.getId(), a.getPatient().getId(), a.getDescription(), a.getCreatedAt()))
				.toList();
	}

	@Transactional
	public AntecedentResponse addAntecedent(AuthenticatedUser currentUser, long patientId, CreateAntecedentRequest request) {
		requireCurrentMedecin(currentUser);
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
			CreateOrdonnanceRequest request) {
		Consultation consultation = consultationRepository.findById(consultationId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation introuvable"));
		assertOwnerMedecin(currentUser, consultation.getMedecin().getId());

		ordonnanceRepository.findByConsultationId(consultationId).ifPresent(existing -> {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Une ordonnance existe deja pour cette consultation");
		});

		byte[] pdfBytes = generateSimplePdf(request.prescription().trim());
		Ordonnance saved = ordonnanceRepository.save(new Ordonnance(
				consultation,
				request.prescription().trim(),
				pdfBytes,
				LocalDateTime.now()));

		return new OrdonnanceResponse(
				saved.getId(),
				consultationId,
				saved.getPrescription(),
				saved.getCreatedAt(),
				"Ordonnance PDF generee et enregistree");
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

	/**
	 * PDF minimal ASCII pour stockage binaire (placeholder simple).
	 */
	private static byte[] generateSimplePdf(String prescription) {
		String escaped = prescription.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
		String pdf = "%PDF-1.4\n"
				+ "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
				+ "2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
				+ "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
				+ "4 0 obj<</Length 75>>stream\nBT /F1 12 Tf 50 780 Td (Ordonnance) Tj 0 -20 Td (" + escaped + ") Tj ET\nendstream endobj\n"
				+ "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
				+ "xref\n0 6\n0000000000 65535 f \n"
				+ "trailer<</Root 1 0 R/Size 6>>\nstartxref\n0\n%%EOF";
		return pdf.getBytes(StandardCharsets.US_ASCII);
	}
}
