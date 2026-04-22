package com.curalink.api.auth.dto;

import com.curalink.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PasswordResetConfirmDto(
		@NotBlank @Email String email,
		@NotBlank String temporaryPassword,
		@NotBlank @StrongPassword String newPassword,
		@NotBlank String confirmPassword
) {
}
