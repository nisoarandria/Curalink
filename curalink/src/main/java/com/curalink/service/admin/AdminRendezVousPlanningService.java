package com.curalink.service.admin;

import com.curalink.api.dto.PageResponse;
import com.curalink.api.rendezvous.dto.RendezVousResponse;
import com.curalink.model.rendezvous.RendezVous;
import com.curalink.repository.RendezVousRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class AdminRendezVousPlanningService {

	private static final int MAX_PAGE_SIZE = 100;

	private final RendezVousRepository rendezVousRepository;

	public AdminRendezVousPlanningService(RendezVousRepository rendezVousRepository) {
		this.rendezVousRepository = rendezVousRepository;
	}

	@Transactional(readOnly = true)
	public PageResponse<RendezVousResponse> listGlobalPlanning(
			int page,
			int size,
			String q,
			Long medecinId,
			LocalDate date) {
		String search = (q == null || q.isBlank()) ? null : q.trim();
		Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by(Sort.Direction.ASC, "dateHeure"));
		if (date == null) {
			return PageResponse.from(rendezVousRepository.searchGlobalNoDate(medecinId, search, pageable)
					.map(AdminRendezVousPlanningService::toResponse));
		}
		LocalDateTime start = date.atStartOfDay();
		LocalDateTime end = date.plusDays(1).atStartOfDay();
		return PageResponse.from(rendezVousRepository.searchGlobalByDate(medecinId, start, end, search, pageable)
				.map(AdminRendezVousPlanningService::toResponse));
	}

	private static RendezVousResponse toResponse(RendezVous rdv) {
		return new RendezVousResponse(
				rdv.getId(),
				rdv.getDateHeure(),
				rdv.getStatus(),
				rdv.getService().getId(),
				rdv.getService().getNom(),
				rdv.getPatient().getId(),
				rdv.getPatient().getPrenom() + " " + rdv.getPatient().getNom(),
				rdv.getMedecin().getId(),
				rdv.getMedecin().getPrenom() + " " + rdv.getMedecin().getNom());
	}

	private static int clampSize(int size) {
		return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
	}
}
