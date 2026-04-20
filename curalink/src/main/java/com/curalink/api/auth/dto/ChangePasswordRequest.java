package com.curalink.api.auth.dto;

import com.curalink.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
		@NotBlank String oldPassword,
		@NotBlank @StrongPassword String newPassword,
		@NotBlank String confirmPassword
) {
}
