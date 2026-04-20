package com.curalink.config;

import com.curalink.model.user.Admin;
import com.curalink.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;

@Component
public class AdminAccountInitializer implements ApplicationRunner {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AdminAccountProperties adminAccountProperties;

	public AdminAccountInitializer(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			AdminAccountProperties adminAccountProperties) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.adminAccountProperties = adminAccountProperties;
	}

	@Override
	public void run(ApplicationArguments args) {
		String email = adminAccountProperties.email();
		String password = adminAccountProperties.password();
		if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
			return;
		}
		String normalized = email.trim().toLowerCase(Locale.ROOT);
		if (userRepository.existsByEmail(normalized)) {
			return;
		}

		String nom = StringUtils.hasText(adminAccountProperties.nom()) ? adminAccountProperties.nom().trim() : "Admin";
		String prenom = StringUtils.hasText(adminAccountProperties.prenom()) ? adminAccountProperties.prenom().trim()
				: "Principal";
		String tel = StringUtils.hasText(adminAccountProperties.telephone()) ? adminAccountProperties.telephone().trim()
				: null;
		String adr = StringUtils.hasText(adminAccountProperties.adresse()) ? adminAccountProperties.adresse().trim()
				: null;

		Admin admin = new Admin(nom, prenom, normalized, tel, adr, null);
		admin.setPasswordHash(passwordEncoder.encode(password));
		userRepository.save(admin);
	}
}
