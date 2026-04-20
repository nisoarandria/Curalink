package com.curalink.service.user;

import com.curalink.api.user.dto.PatientRegistrationRequest;
import com.curalink.api.user.dto.PatientRegistrationResponse;
import com.curalink.model.user.Patient;
import com.curalink.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class PatientRegistrationService {

	private final PatientRepository patientRepository;

	public PatientRegistrationService(PatientRepository patientRepository) {
		this.patientRepository = patientRepository;
	}

	@Transactional
	public PatientRegistrationResponse register(PatientRegistrationRequest request) {
		String email = request.email().trim().toLowerCase(Locale.ROOT);
		if (patientRepository.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est déjà enregistré");
		}

		Patient patient = new Patient(
				request.nom().trim(),
				request.prenom().trim(),
				email,
				request.telephone().trim(),
				request.adresse().trim(),
				null,
				request.dateNaissance(),
				request.sexe());

		Patient saved = patientRepository.save(patient);
		return PatientRegistrationResponse.from(saved);
	}
}
