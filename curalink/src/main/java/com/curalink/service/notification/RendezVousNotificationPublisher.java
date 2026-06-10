package com.curalink.service.notification;

import com.curalink.model.notification.RendezVousNotificationLabel;
import com.curalink.model.rendezvous.RendezVous;
import com.curalink.model.rendezvous.RendezVousStatus;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Patient;
import com.curalink.security.AuthenticatedUser;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class RendezVousNotificationPublisher {

	private static final DateTimeFormatter DATE_HEURE =
			DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm", Locale.FRANCE);

	private final NotificationService notificationService;

	public RendezVousNotificationPublisher(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	public void onDemandeRendezVous(RendezVous rdv) {
		Patient patient = rdv.getPatient();
		Medecin medecin = rdv.getMedecin();
		String message = String.format(
				"%s %s a demandé un rendez-vous pour le %s (%s).",
				patient.getPrenom(),
				patient.getNom(),
				formatDateHeure(rdv.getDateHeure()),
				rdv.getService().getNom());
		notify(medecin.getId(), rdv, message, RendezVousNotificationLabel.DEMANDE_RDV);
	}

	public void onPropositionCreneau(RendezVous rdv, boolean nouvelleDate) {
		Patient patient = rdv.getPatient();
		Medecin medecin = rdv.getMedecin();
		String message = nouvelleDate
				? String.format(
						"Dr %s %s vous propose un nouveau créneau le %s (%s).",
						medecin.getPrenom(),
						medecin.getNom(),
						formatDateHeure(rdv.getDateHeure()),
						rdv.getService().getNom())
				: String.format(
						"Dr %s %s vous propose un rendez-vous le %s (%s).",
						medecin.getPrenom(),
						medecin.getNom(),
						formatDateHeure(rdv.getDateHeure()),
						rdv.getService().getNom());
		notify(patient.getId(), rdv, message, RendezVousNotificationLabel.PROPOSITION_DATE);
	}

	public void onConfirmation(RendezVous rdv, AuthenticatedUser confirmedBy) {
		if (confirmedBy.userId().equals(rdv.getPatient().getId())) {
			notifyMedecinConfirmation(rdv, "Le patient a confirmé le rendez-vous");
		} else {
			notifyPatientConfirmation(rdv, "Votre rendez-vous a été confirmé par le médecin");
		}
	}

	public void onRefus(RendezVous rdv) {
		Patient patient = rdv.getPatient();
		Medecin medecin = rdv.getMedecin();
		String message = String.format(
				"%s %s a refusé le créneau proposé pour le %s.",
				patient.getPrenom(),
				patient.getNom(),
				formatDateHeure(rdv.getDateHeure()));
		notify(medecin.getId(), rdv, message, RendezVousNotificationLabel.REFUS_RDV);
	}

	public void onAnnulation(RendezVous rdv, AuthenticatedUser cancelledBy) {
		boolean cancelledByPatient = cancelledBy.userId().equals(rdv.getPatient().getId());
		if (cancelledByPatient) {
			Medecin medecin = rdv.getMedecin();
			Patient patient = rdv.getPatient();
			String message = String.format(
					"%s %s a annulé le rendez-vous du %s.",
					patient.getPrenom(),
					patient.getNom(),
					formatDateHeure(rdv.getDateHeure()));
			notify(medecin.getId(), rdv, message, RendezVousNotificationLabel.ANNULATION_RDV);
		} else {
			notifyPatientStatusChange(
					rdv,
					"Le médecin a annulé votre rendez-vous du %s.",
					RendezVousNotificationLabel.ANNULATION_RDV);
		}
	}

	public void onTerminaison(RendezVous rdv) {
		notifyPatientStatusChange(
				rdv,
				"Votre rendez-vous du %s a été marqué comme terminé.",
				RendezVousNotificationLabel.TERMINAISON_RDV);
	}

	public void onAbsencePatient(RendezVous rdv) {
		notifyPatientStatusChange(
				rdv,
				"Vous avez été marqué(e) absent(e) pour le rendez-vous du %s.",
				RendezVousNotificationLabel.ABSENCE_PATIENT);
	}

	public void onChangementStatut(RendezVous rdv, RendezVousStatus nouveauStatut) {
		String message = String.format(
				"Le statut de votre rendez-vous du %s est passé à %s.",
				formatDateHeure(rdv.getDateHeure()),
				nouveauStatut.name());
		notify(rdv.getPatient().getId(), rdv, message, RendezVousNotificationLabel.CHANGEMENT_STATUT);
	}

	private void notifyMedecinConfirmation(RendezVous rdv, String intro) {
		Patient patient = rdv.getPatient();
		Medecin medecin = rdv.getMedecin();
		String message = String.format(
				"%s (%s %s) pour le %s (%s).",
				intro,
				patient.getPrenom(),
				patient.getNom(),
				formatDateHeure(rdv.getDateHeure()),
				rdv.getService().getNom());
		notify(medecin.getId(), rdv, message, RendezVousNotificationLabel.CONFIRMATION_RDV);
	}

	private void notifyPatientConfirmation(RendezVous rdv, String intro) {
		Medecin medecin = rdv.getMedecin();
		String message = String.format(
				"%s avec Dr %s %s le %s (%s).",
				intro,
				medecin.getPrenom(),
				medecin.getNom(),
				formatDateHeure(rdv.getDateHeure()),
				rdv.getService().getNom());
		notify(rdv.getPatient().getId(), rdv, message, RendezVousNotificationLabel.CONFIRMATION_RDV);
	}

	private void notifyPatientStatusChange(
			RendezVous rdv,
			String messageTemplate,
			RendezVousNotificationLabel label) {
		String message = String.format(messageTemplate, formatDateHeure(rdv.getDateHeure()));
		notify(rdv.getPatient().getId(), rdv, message, label);
	}

	private void notify(long recipientId, RendezVous rdv, String message, RendezVousNotificationLabel label) {
		notificationService.create(recipientId, rdv.getId(), message, rdv.getDateHeure(), label);
	}

	private static String formatDateHeure(LocalDateTime dateHeure) {
		return DATE_HEURE.format(dateHeure);
	}
}
