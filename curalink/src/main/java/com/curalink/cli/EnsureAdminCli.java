package com.curalink.cli;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Utilitaire en ligne de commande (sans lancer Spring Boot).
 * <p>
 * Création admin si absent :
 * <pre>
 *   export DATABASE_URL="jdbc:postgresql://..."
 *   export ADMIN_PASSWORD="votreMotDePasse"
 *   export ADMIN_EMAIL="admin@votredomaine.com"   # optionnel
 *   mvn -q compile exec:java -Dexec.mainClass=com.curalink.cli.EnsureAdminCli
 * </pre>
 * Génération d'un hash bcrypt (pour coller dans du SQL) :
 * <pre>
 *   mvn -q compile exec:java -Dexec.mainClass=com.curalink.cli.EnsureAdminCli -Dexec.args="--bcrypt MonMotDePasse"
 * </pre>
 */
public final class EnsureAdminCli {

	private EnsureAdminCli() {
	}

	public static void main(String[] args) throws Exception {
		if (args.length >= 1 && "--bcrypt".equals(args[0])) {
			String pwd = args.length >= 2 ? args[1] : "";
			System.out.println(new BCryptPasswordEncoder().encode(pwd));
			return;
		}

		String dsn = firstNonBlank(System.getenv("DATABASE_URL"), System.getenv("SUPABASE_JDBC_URL"));
		String email = System.getenv().getOrDefault("ADMIN_EMAIL", "admin@curalink.local").trim().toLowerCase();
		String password = System.getenv("ADMIN_PASSWORD");

		if (dsn == null || dsn.isBlank()) {
			System.err.println("Définissez DATABASE_URL ou SUPABASE_JDBC_URL (JDBC PostgreSQL).");
			System.exit(1);
		}
		if (password == null || password.isBlank()) {
			System.err.println("Définissez ADMIN_PASSWORD.");
			System.exit(1);
		}

		String hash = new BCryptPasswordEncoder().encode(password);

		try (Connection c = DriverManager.getConnection(dsn)) {
			c.setAutoCommit(false);
			try (PreparedStatement sel = c.prepareStatement(
					"SELECT 1 FROM users WHERE lower(email) = lower(?)")) {
				sel.setString(1, email);
				try (ResultSet rs = sel.executeQuery()) {
					if (rs.next()) {
						System.out.println("Admin déjà présent : " + email);
						return;
					}
				}
			}
			try (PreparedStatement ins = c.prepareStatement(
					"INSERT INTO users (user_type, nom, prenom, email, telephone, adresse, photo_profile, password_hash, date_naissance, sexe) "
							+ "VALUES ('ADMIN', 'Admin', 'Principal', ?, NULL, NULL, NULL, ?, NULL, NULL)")) {
				ins.setString(1, email);
				ins.setString(2, hash);
				ins.executeUpdate();
			}
			c.commit();
			System.out.println("Admin créé : " + email);
		}
	}

	private static String firstNonBlank(String a, String b) {
		if (a != null && !a.isBlank()) {
			return a;
		}
		if (b != null && !b.isBlank()) {
			return b;
		}
		return null;
	}
}
