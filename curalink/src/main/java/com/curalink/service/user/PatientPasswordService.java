package com.curalink.service.user;

import com.curalink.api.user.dto.PatientSetPasswordRequest;
import com.curalink.api.user.dto.PatientSetPasswordResponse;
import com.curalink.model.user.Patient;
import com.curalink.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class PatientPasswordService {

	private final PatientRepository patientRepository;
	private final PasswordEncoder passwordEncoder;

	public PatientPasswordService(PatientRepository patientRepository, PasswordEncoder passwordEncoder) {
		this.patientRepository = patientRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public PatientSetPasswordResponse setInitialPassword(PatientSetPasswordRequest request) {
		if (!request.password().equals(request.confirmPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Les mots de passe ne correspondent pas");
		}

		String email = request.email().trim().toLowerCase(Locale.ROOT);
		Patient patient = patientRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable"));

		if (patient.getPasswordHash() != null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Le mot de passe est déjà défini");
		}

		patient.setPasswordHash(passwordEncoder.encode(request.password()));
		return new PatientSetPasswordResponse(
				"Mot de passe défini avec succès",
				patient.getId(),
				patient.getEmail());
	}
}
