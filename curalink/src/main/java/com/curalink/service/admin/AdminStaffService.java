package com.curalink.service.admin;

import com.curalink.api.admin.dto.CreateStaffRequest;
import com.curalink.api.admin.dto.CreateStaffResponse;
import com.curalink.api.admin.dto.PatientSummary;
import com.curalink.api.admin.dto.ServiceSummary;
import com.curalink.api.admin.dto.StaffRole;
import com.curalink.api.admin.dto.StaffSummary;
import com.curalink.api.dto.PageResponse;
import com.curalink.model.catalog.ServiceItem;
import com.curalink.model.user.Admin;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Nutritionniste;
import com.curalink.model.user.Patient;
import com.curalink.model.user.User;
import com.curalink.repository.PatientRepository;
import com.curalink.repository.ServiceItemRepository;
import com.curalink.repository.UserRepository;
import com.curalink.service.mail.PasswordResetMailNotifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.UUID;

@Service
public class AdminStaffService {

	private static final int MAX_PAGE_SIZE = 100;

	private static final String STAFF_CREATED_MESSAGE =
			"Un e-mail contenant le mot de passe provisoire a été envoyé à l’adresse indiquée.";

	private final UserRepository userRepository;
	private final PatientRepository patientRepository;
	private final ServiceItemRepository serviceItemRepository;
	private final PasswordEncoder passwordEncoder;
	private final PasswordResetMailNotifier mailNotifier;

	public AdminStaffService(
			UserRepository userRepository,
			PatientRepository patientRepository,
			ServiceItemRepository serviceItemRepository,
			PasswordEncoder passwordEncoder,
			PasswordResetMailNotifier mailNotifier) {
		this.userRepository = userRepository;
		this.patientRepository = patientRepository;
		this.serviceItemRepository = serviceItemRepository;
		this.passwordEncoder = passwordEncoder;
		this.mailNotifier = mailNotifier;
	}

	@Transactional(readOnly = true)
	public PageResponse<StaffSummary> listStaff(int page, int size, String q, StaffRole type) {
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.ASC, "nom"));
		String userType = type != null ? type.name() : null;
		String search = StringUtils.hasText(q) ? q.trim() : null;
		Page<User> result = userRepository.searchStaff(search, userType, pageable);
		return PageResponse.from(result.map(this::toStaffSummary));
	}

	@Transactional(readOnly = true)
	public PageResponse<PatientSummary> listPatients(int page, int size, String q) {
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.ASC, "nom"));
		String search = StringUtils.hasText(q) ? q.trim() : null;
		Page<Patient> result = patientRepository.searchPatients(search, pageable);
		return PageResponse.from(result.map(p -> new PatientSummary(
				p.getId(),
				p.getEmail(),
				p.getNom(),
				p.getPrenom(),
				p.getTelephone(),
				p.getAdresse(),
				p.getDateNaissance(),
				p.getSexe())));
	}

	private StaffSummary toStaffSummary(User u) {
		if (u instanceof Medecin m) {
			ServiceSummary svc = null;
			if (m.getService() != null) {
				ServiceItem si = m.getService();
				svc = new ServiceSummary(si.getId(), si.getNom());
			}
			return new StaffSummary(
					m.getId(),
					m.getEmail(),
					m.getNom(),
					m.getPrenom(),
					m.getTelephone(),
					m.getAdresse(),
					m.getNumeroInscription(),
					StaffRole.MEDECIN,
					svc,
					m.isFirstConnexion());
		}
		if (u instanceof Nutritionniste n) {
			return new StaffSummary(
					n.getId(),
					n.getEmail(),
					n.getNom(),
					n.getPrenom(),
					n.getTelephone(),
					n.getAdresse(),
					null,
					StaffRole.NUTRITIONNISTE,
					null,
					n.isFirstConnexion());
		}
		throw new IllegalStateException("Utilisateur attendu: médecin ou nutritionniste");
	}

	private static int clampSize(int size) {
		return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
	}

	@Transactional
	public CreateStaffResponse createStaff(CreateStaffRequest request) {
		String email = request.email().trim().toLowerCase(Locale.ROOT);
		if (userRepository.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est déjà utilisé");
		}

		String initialPassword = generateRandomInitialPassword();
		String hash = passwordEncoder.encode(initialPassword);

		User saved = switch (request.role()) {
			case MEDECIN -> {
				if (request.serviceId() == null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Le champ serviceId est obligatoire pour la création d’un médecin");
				}
				if (!StringUtils.hasText(request.numeroInscription())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Le champ numeroInscription est obligatoire pour la création d’un médecin");
				}
				ServiceItem service = serviceItemRepository.findById(request.serviceId())
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service introuvable"));
				Medecin m = new Medecin(
						request.nom().trim(),
						request.prenom().trim(),
						email,
						request.telephone().trim(),
						request.adresseCabinet().trim(),
						request.numeroInscription().trim(),
						null,
						service);
				m.setPasswordHash(hash);
				m.setFirstConnexion(true);
				yield userRepository.save(m);
			}
			case NUTRITIONNISTE -> {
				Nutritionniste n = new Nutritionniste(
						request.nom().trim(),
						request.prenom().trim(),
						email,
						request.telephone().trim(),
						request.adresseCabinet().trim(),
						null);
				n.setPasswordHash(hash);
				n.setFirstConnexion(true);
				yield userRepository.save(n);
			}
		};

		String roleLabel = request.role() == StaffRole.MEDECIN ? "médecin" : "nutritionniste";
		mailNotifier.sendStaffInitialPassword(saved.getEmail(), initialPassword, saved.getPrenom(), roleLabel);

		Long outServiceId = null;
		String outServiceNom = null;
		String outNumeroInscription = null;
		if (saved instanceof Medecin med) {
			ServiceItem si = med.getService();
			if (si != null) {
				outServiceId = si.getId();
				outServiceNom = si.getNom();
			}
			outNumeroInscription = med.getNumeroInscription();
		}

		return new CreateStaffResponse(
				saved.getId(),
				saved.getEmail(),
				saved.getNom(),
				saved.getPrenom(),
				saved.getTelephone(),
				saved.getAdresse(),
				outNumeroInscription,
				request.role(),
				outServiceId,
				outServiceNom,
				true,
				STAFF_CREATED_MESSAGE);
	}

	@Transactional
	public void deleteStaffAccount(long userId, long currentAdminId) {
		if (userId == currentAdminId) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible de supprimer votre propre compte administrateur");
		}

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

		if (user instanceof Patient || user instanceof Admin) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Seuls les comptes médecin et nutritionniste peuvent être supprimés via cet endpoint");
		}

		userRepository.delete(user);
	}

	private static String generateRandomInitialPassword() {
		return "Aa1!" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}
}
