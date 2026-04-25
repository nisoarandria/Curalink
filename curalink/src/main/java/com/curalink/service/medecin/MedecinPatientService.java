package com.curalink.service.medecin;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.medecin.dto.MedecinPatientSummary;
import com.curalink.model.user.Patient;
import com.curalink.repository.PatientRepository;
import com.curalink.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MedecinPatientService {

	private static final int MAX_PAGE_SIZE = 100;
	private final PatientRepository patientRepository;

	public MedecinPatientService(PatientRepository patientRepository) {
		this.patientRepository = patientRepository;
	}

	@Transactional(readOnly = true)
	public PageResponse<MedecinPatientSummary> listMyPatients(AuthenticatedUser currentUser, int page, int size, String q) {
		long medecinId = requireCurrentMedecinId(currentUser);
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.ASC, "nom"));
		String search = StringUtils.hasText(q) ? q.trim() : null;
		Page<Patient> result = patientRepository.searchPatientsForMedecin(medecinId, search, pageable);
		return PageResponse.from(result.map(this::toSummary));
	}

	@Transactional(readOnly = true)
	public MedecinPatientSummary getMyPatientDetail(AuthenticatedUser currentUser, long patientId) {
		long medecinId = requireCurrentMedecinId(currentUser);
		Patient patient = patientRepository.findById(patientId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable"));
		if (!patientRepository.existsLinkedToMedecin(patientId, medecinId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce patient n'est pas rattache au medecin connecte");
		}
		return toSummary(patient);
	}

	private long requireCurrentMedecinId(AuthenticatedUser currentUser) {
		if (currentUser == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifie");
		}
		if ("MEDECIN".equalsIgnoreCase(currentUser.userType())) {
			return currentUser.userId();
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action reservee aux medecins");
	}

	private MedecinPatientSummary toSummary(Patient p) {
		return new MedecinPatientSummary(
				p.getId(),
				p.getEmail(),
				p.getNom(),
				p.getPrenom(),
				p.getTelephone(),
				p.getAdresse(),
				p.getDateNaissance(),
				p.getSexe());
	}

	private static int clampSize(int size) {
		return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
	}
}
