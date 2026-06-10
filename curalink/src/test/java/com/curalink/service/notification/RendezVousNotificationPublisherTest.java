package com.curalink.service.notification;

import com.curalink.model.catalog.ServiceItem;
import com.curalink.model.notification.RendezVousNotificationLabel;
import com.curalink.model.rendezvous.RendezVous;
import com.curalink.model.rendezvous.RendezVousStatus;
import com.curalink.model.user.Medecin;
import com.curalink.model.user.Patient;
import com.curalink.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RendezVousNotificationPublisherTest {

	@Mock
	private NotificationService notificationService;

	private RendezVousNotificationPublisher publisher;

	private RendezVous rdv;

	@BeforeEach
	void setUp() {
		publisher = new RendezVousNotificationPublisher(notificationService);
		ServiceItem service = new ServiceItem("Cardiologie", "Desc", "img.png");
		Patient patient = new Patient("Ravo", "Aina", "a@t.mg", "0340000001", "Adr", null, null, null);
		Medecin medecin = new Medecin("Rakoto", "Jean", "m@t.mg", "0340000002", "Cabinet", "ORD-MED-001", null, service);
		setId(patient, 10L);
		setId(medecin, 20L);
		rdv = new RendezVous(
				LocalDateTime.of(2026, 6, 15, 9, 30),
				service,
				patient,
				medecin,
				RendezVousStatus.EN_ATTENTE);
		setId(rdv, 42L);
	}

	@Test
	void onDemandeRendezVous_notifiesMedecin() {
		publisher.onDemandeRendezVous(rdv);

		verify(notificationService).create(
				eq(20L),
				eq(42L),
				eq("Aina Ravo a demandé un rendez-vous pour le 15/06/2026 à 09:30 (Cardiologie)."),
				eq(rdv.getDateHeure()),
				eq(RendezVousNotificationLabel.DEMANDE_RDV));
	}

	@Test
	void onConfirmation_byMedecin_notifiesPatient() {
		publisher.onConfirmation(rdv, new AuthenticatedUser(20L, "m@t.mg", "MEDECIN"));

		ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
		verify(notificationService).create(
				eq(10L),
				eq(42L),
				messageCaptor.capture(),
				any(),
				eq(RendezVousNotificationLabel.CONFIRMATION_RDV));
		assertEquals(
				"Votre rendez-vous a été confirmé par le médecin avec Dr Jean Rakoto le 15/06/2026 à 09:30 (Cardiologie).",
				messageCaptor.getValue());
	}

	private static void setId(Object entity, long id) {
		try {
			var field = entity.getClass().getSuperclass().getDeclaredField("id");
			if (!field.canAccess(entity)) {
				field.setAccessible(true);
			}
			field.set(entity, id);
		} catch (ReflectiveOperationException ex) {
			try {
				var field = entity.getClass().getDeclaredField("id");
				field.setAccessible(true);
				field.set(entity, id);
			} catch (ReflectiveOperationException e) {
				throw new RuntimeException(e);
			}
		}
	}
}
