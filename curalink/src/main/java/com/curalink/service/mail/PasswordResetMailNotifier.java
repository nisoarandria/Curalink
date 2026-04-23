package com.curalink.service.mail;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Envoie les e-mails de mot de passe (réinitialisation, création staff). Corps en UTF-8, sans
 * {@link String#formatted(Object...)} sur le mot de passe (caractères {@code %} possibles).
 */
@Component
public class PasswordResetMailNotifier {

	private static final Logger log = LoggerFactory.getLogger(PasswordResetMailNotifier.class);

	private final ObjectProvider<JavaMailSender> mailSender;
	private final String smtpHost;
	private final String fromAddress;
	private static final DateTimeFormatter RDV_DATE_FORMAT =
			DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRANCE);
	private static final DateTimeFormatter RDV_TIME_FORMAT =
			DateTimeFormatter.ofPattern("HH:mm", Locale.FRANCE);

	public PasswordResetMailNotifier(
			ObjectProvider<JavaMailSender> mailSender,
			@Value("${spring.mail.host:}") String smtpHost,
			@Value("${app.mail.from:noreply@curalink.local}") String fromAddress) {
		this.mailSender = mailSender;
		this.smtpHost = smtpHost;
		this.fromAddress = fromAddress;
	}

	public void sendTemporaryPassword(String toEmail, String temporaryPassword) {
		String subject = "Curalink — réinitialisation de votre mot de passe";
		String body = """
				Bonjour,

				Vous avez demandé la réinitialisation de votre mot de passe.

				Voici votre mot de passe temporaire (à saisir sur la page de confirmation, puis choisissez un nouveau mot de passe) :
				"""
				+ "\n\n"
				+ temporaryPassword
				+ """

				Ce code expire après le délai indiqué par l’administrateur de la plateforme.

				Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.

				Cordialement,
				L’équipe Curalink
				""";
		sendUtf8Text(toEmail, subject, body, temporaryPassword, "réinitialisation");
	}

	/**
	 * Envoi du mot de passe provisoire lors de la création d’un compte médecin / nutritionniste par l’admin.
	 */
	public void sendStaffInitialPassword(String toEmail, String plainPassword, String prenom, String roleLabel) {
		String subject = "Curalink — votre compte professionnel";
		String safePrenom = prenom != null ? prenom : "";
		String body = new StringBuilder()
				.append("Bonjour ").append(safePrenom).append(",\r\n\r\n")
				.append("Un administrateur a créé votre compte (").append(roleLabel).append(") sur Curalink.\r\n\r\n")
				.append("Votre mot de passe provisoire est le suivant (copiez-collez la ligne entière) :\r\n\r\n")
				.append(plainPassword)
				.append("\r\n\r\n")
				.append("Connectez-vous avec votre adresse e-mail et ce mot de passe, puis changez-le dès que possible ")
				.append("(menu changement de mot de passe).\r\n\r\n")
				.append("Cordialement,\r\n")
				.append("L’équipe Curalink\r\n")
				.toString();
		sendUtf8Text(toEmail, subject, body, plainPassword, "compte staff");
	}

	/**
	 * Envoi d'un e-mail de confirmation du rendez-vous au patient avec le récapitulatif.
	 */
	public void sendRendezVousConfirmationRecap(
			String toEmail,
			String patientPrenom,
			String medecinNomComplet,
			String specialite,
			LocalDateTime dateHeure,
			String adresseCabinet) {
		String subject = "Curalink — confirmation de votre rendez-vous";
		String safePrenom = patientPrenom != null ? patientPrenom : "";
		String safeMedecin = medecinNomComplet != null ? medecinNomComplet : "-";
		String safeSpecialite = specialite != null ? specialite : "-";
		String safeAdresse = adresseCabinet != null ? adresseCabinet : "-";
		String dateLabel = dateHeure != null ? dateHeure.toLocalDate().format(RDV_DATE_FORMAT) : "-";
		String heureLabel = dateHeure != null ? dateHeure.toLocalTime().format(RDV_TIME_FORMAT) : "-";
		String body = new StringBuilder()
				.append("Bonjour ").append(safePrenom).append(",\r\n\r\n")
				.append("Votre rendez-vous a été confirmé.\r\n\r\n")
				.append("Récapitulatif :\r\n")
				.append("- Médecin : ").append(safeMedecin).append("\r\n")
				.append("- Spécialité : ").append(safeSpecialite).append("\r\n")
				.append("- Date : ").append(dateLabel).append("\r\n")
				.append("- Heure : ").append(heureLabel).append("\r\n")
				.append("- Adresse du cabinet : ").append(safeAdresse).append("\r\n\r\n")
				.append("Merci de vous présenter quelques minutes avant l'heure prévue.\r\n\r\n")
				.append("Cordialement,\r\n")
				.append("L’équipe Curalink\r\n")
				.toString();
		sendUtf8Text(toEmail, subject, body, "RDV#" + dateLabel + " " + heureLabel, "confirmation rendez-vous");
	}

	private void sendUtf8Text(String toEmail, String subject, String body, String secretForLogs, String logLabel) {
		if (!StringUtils.hasText(smtpHost)) {
			log.warn(
					"SMTP non configuré (spring.mail.host / SMTP_HOST) — email {} non envoyé. Destinataire: {} | secret: {}",
					logLabel,
					toEmail,
					secretForLogs);
			return;
		}
		JavaMailSender sender = mailSender.getIfAvailable();
		if (sender == null) {
			log.warn("JavaMailSender indisponible — {} pour {} : {}", logLabel, toEmail, secretForLogs);
			return;
		}
		try {
			MimeMessage message = sender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
			helper.setFrom(fromAddress);
			helper.setTo(toEmail);
			helper.setSubject(subject);
			helper.setText(body, false);
			sender.send(message);
			log.info("Email {} envoyé à {}", logLabel, toEmail);
		} catch (Exception e) {
			log.error("Échec d’envoi de l’email ({}) à {}", logLabel, toEmail, e);
			log.warn("Secret pour {} : {}", toEmail, secretForLogs);
		}
	}
}
