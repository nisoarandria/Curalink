package com.curalink.service.rendezvous;

import com.curalink.api.rendezvous.dto.MedecinDisponibiliteResponse;
import com.curalink.api.rendezvous.dto.MedecinOptionResponse;
import com.curalink.api.rendezvous.dto.ServiceDisponibiliteResponse;
import com.curalink.api.rendezvous.dto.ServiceOptionResponse;
import com.curalink.config.ServiceItemStorageProperties;
import com.curalink.model.catalog.ServiceItem;
import com.curalink.model.disponibilite.Disponibilite;
import com.curalink.model.disponibilite.JourSemaine;
import com.curalink.model.user.Medecin;
import com.curalink.repository.DisponibiliteRepository;
import com.curalink.repository.MedecinRepository;
import com.curalink.repository.ServiceItemRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class DisponibiliteQueryService {

	private final ServiceItemRepository serviceItemRepository;
	private final MedecinRepository medecinRepository;
	private final DisponibiliteRepository disponibiliteRepository;
	private final ServiceItemStorageProperties storageProperties;
	private String publicObjectBaseUrl;

	public DisponibiliteQueryService(
			ServiceItemRepository serviceItemRepository,
			MedecinRepository medecinRepository,
			DisponibiliteRepository disponibiliteRepository,
			ServiceItemStorageProperties storageProperties) {
		this.serviceItemRepository = serviceItemRepository;
		this.medecinRepository = medecinRepository;
		this.disponibiliteRepository = disponibiliteRepository;
		this.storageProperties = storageProperties;
	}

	@PostConstruct
	void initStorage() {
		if (!StringUtils.hasText(storageProperties.supabaseUrl())
				|| !StringUtils.hasText(storageProperties.bucket())
				|| !StringUtils.hasText(storageProperties.apiKey())) {
			this.publicObjectBaseUrl = null;
			return;
		}
		String base = storageProperties.supabaseUrl().trim();
		if (base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		String bucket = storageProperties.bucket().trim();
		this.publicObjectBaseUrl = base + "/storage/v1/object/public/" + bucket + "/";
	}

	@Transactional(readOnly = true)
	public List<ServiceOptionResponse> listServices() {
		return serviceItemRepository.findAllByOrderByNomAsc().stream()
				.map(s -> new ServiceOptionResponse(
						s.getId(),
						s.getNom(),
						s.getDescription(),
						buildPublicUrl(s.getIllustrationFile())))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<MedecinOptionResponse> listMedecinsByService(long serviceId) {
		ServiceItem service = serviceItemRepository.findById(serviceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service introuvable"));
		return medecinRepository.findByServiceIdOrderByNomAscPrenomAsc(serviceId).stream()
				.map(m -> new MedecinOptionResponse(
						m.getId(),
						formatMedecinName(m),
						service.getNom(),
						m.getAdresse(),
						m.getNumeroInscription()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<MedecinDisponibiliteResponse> listDisponibilitesByMedecin(long medecinId) {
		medecinRepository.findById(medecinId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Médecin introuvable"));
		LocalDate start = LocalDate.now();
		LocalDate end = start.plusDays(30);
		return expandOccurrences(disponibiliteRepository.findByMedecinIdOrdered(medecinId), start, end).stream()
				.map(o -> new MedecinDisponibiliteResponse(o.date(), o.heure()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<ServiceDisponibiliteResponse> listDisponibilitesByServiceAndDate(long serviceId, LocalDate date) {
		serviceItemRepository.findById(serviceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service introuvable"));

		List<Disponibilite> disponibilites = disponibiliteRepository.findByServiceAndDateOrdered(serviceId, date);
		return expandOccurrences(disponibilites, date, date).stream()
				.map(o -> new ServiceDisponibiliteResponse(
						o.medecin().getId(),
						formatMedecinName(o.medecin()),
						o.heure()))
				.toList();
	}

	private static List<Occurrence> expandOccurrences(List<Disponibilite> rules, LocalDate start, LocalDate end) {
		List<Occurrence> out = new ArrayList<>();
		for (Disponibilite d : rules) {
			LocalDate from = max(start, d.getDateDebut());
			LocalDate to = min(end, d.getDateFin());
			if (to.isBefore(from)) {
				continue;
			}
			long days = ChronoUnit.DAYS.between(from, to);
			for (long i = 0; i <= days; i++) {
				LocalDate date = from.plusDays(i);
				JourSemaine day = toJourSemaine(date);
				if (d.getJoursSemaine().contains(day)) {
					out.add(new Occurrence(d.getMedecin(), date, d.getHeureDebut()));
				}
			}
		}
		out.sort((a, b) -> {
			int byDate = a.date().compareTo(b.date());
			if (byDate != 0) {
				return byDate;
			}
			int byTime = a.heure().compareTo(b.heure());
			if (byTime != 0) {
				return byTime;
			}
			return Long.compare(a.medecin().getId(), b.medecin().getId());
		});
		return out;
	}

	private static JourSemaine toJourSemaine(LocalDate date) {
		return switch (date.getDayOfWeek()) {
			case MONDAY -> JourSemaine.LUN;
			case TUESDAY -> JourSemaine.MAR;
			case WEDNESDAY -> JourSemaine.MER;
			case THURSDAY -> JourSemaine.JEU;
			case FRIDAY -> JourSemaine.VEN;
			case SATURDAY -> JourSemaine.SAM;
			case SUNDAY -> JourSemaine.DIM;
		};
	}

	private static LocalDate max(LocalDate a, LocalDate b) {
		return a.isAfter(b) ? a : b;
	}

	private static LocalDate min(LocalDate a, LocalDate b) {
		return a.isBefore(b) ? a : b;
	}

	private static String formatMedecinName(Medecin medecin) {
		return "Dr " + medecin.getPrenom() + " " + medecin.getNom();
	}

	private String buildPublicUrl(String objectKey) {
		if (!StringUtils.hasText(objectKey)) {
			return null;
		}
		if (!StringUtils.hasText(publicObjectBaseUrl)) {
			return objectKey;
		}
		return publicObjectBaseUrl + objectKey;
	}

	private record Occurrence(Medecin medecin, LocalDate date, java.time.LocalTime heure) {
	}
}
