package com.curalink.api.user;

import com.curalink.api.user.dto.PatientRegistrationRequest;
import com.curalink.api.user.dto.PatientRegistrationResponse;
import com.curalink.api.user.dto.PatientSetPasswordRequest;
import com.curalink.api.user.dto.PatientSetPasswordResponse;
import com.curalink.service.user.PatientPasswordService;
import com.curalink.service.user.PatientRegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientRegistrationController {

	private final PatientRegistrationService patientRegistrationService;
	private final PatientPasswordService patientPasswordService;

	public PatientRegistrationController(PatientRegistrationService patientRegistrationService,
			PatientPasswordService patientPasswordService) {
		this.patientRegistrationService = patientRegistrationService;
		this.patientPasswordService = patientPasswordService;
	}

	@PostMapping("/register")
	public ResponseEntity<PatientRegistrationResponse> register(
			@Valid @RequestBody PatientRegistrationRequest request) {
		PatientRegistrationResponse body = patientRegistrationService.register(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(body);
	}

	@PostMapping("/set-password")
	public ResponseEntity<PatientSetPasswordResponse> setPassword(@Valid @RequestBody PatientSetPasswordRequest request) {
		return ResponseEntity.ok(patientPasswordService.setInitialPassword(request));
	}
}
