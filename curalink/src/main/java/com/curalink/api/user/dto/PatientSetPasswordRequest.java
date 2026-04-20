package com.curalink.api.user.dto;

import com.curalink.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PatientSetPasswordRequest(
		@NotBlank @Email String email,
		@NotBlank @StrongPassword String password,
		@NotBlank @Size(max = 128) String confirmPassword
) {
}
