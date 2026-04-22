package com.curalink.cli;

import io.github.cdimascio.dotenv.Dotenv;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Réinitialise le contenu de la base (TRUNCATE de toutes les tables utilisateur du schéma public).
 *
 * Utilisation :
 * RESET_DB_CONFIRM=YES mvn -q compile exec:java -Dexec.mainClass=com.curalink.cli.ResetDatabaseCli
 */
public final class ResetDatabaseCli {

	private ResetDatabaseCli() {
	}

	public static void main(String[] args) throws Exception {
		Dotenv dotenv = Dotenv.configure().ignoreIfMalformed().ignoreIfMissing().load();

		String confirm = env("RESET_DB_CONFIRM", dotenv);
		if (!"YES".equals(confirm)) {
			System.err.println("Action bloquée: définissez RESET_DB_CONFIRM=YES pour confirmer la suppression.");
			System.exit(1);
		}

		String dsn = firstNonBlank(env("DATABASE_URL", dotenv), env("SUPABASE_JDBC_URL", dotenv));
		String user = firstNonBlank(env("DATABASE_USER", dotenv), env("SUPABASE_DB_USERNAME", dotenv));
		String pass = firstNonBlank(env("DATABASE_PASSWORD", dotenv), env("SUPABASE_DB_PASSWORD", dotenv));

		if (dsn == null || dsn.isBlank()) {
			System.err.println("Définissez DATABASE_URL ou SUPABASE_JDBC_URL.");
			System.exit(1);
		}

		try (Connection c = DriverManager.getConnection(dsn, user, pass)) {
			c.setAutoCommit(false);
			List<String> tables = listPublicTables(c);
			if (tables.isEmpty()) {
				System.out.println("Aucune table utilisateur trouvée dans le schéma public.");
				return;
			}

			String truncateSql = "TRUNCATE TABLE "
					+ String.join(", ", tables.stream().map(ResetDatabaseCli::quoteIdentifier).toList())
					+ " RESTART IDENTITY CASCADE";

			try (Statement st = c.createStatement()) {
				st.execute(truncateSql);
			}
			c.commit();
			System.out.println("Base réinitialisée: " + tables.size() + " table(s) vidée(s).");
		}
	}

	private static List<String> listPublicTables(Connection c) throws Exception {
		String sql = """
				SELECT tablename
				FROM pg_tables
				WHERE schemaname = 'public'
				AND tablename NOT IN ('flyway_schema_history')
				ORDER BY tablename
				""";
		List<String> tables = new ArrayList<>();
		try (PreparedStatement ps = c.prepareStatement(sql);
				ResultSet rs = ps.executeQuery()) {
			while (rs.next()) {
				tables.add(rs.getString(1));
			}
		}
		return tables;
	}

	private static String quoteIdentifier(String identifier) {
		return "\"" + identifier.replace("\"", "\"\"") + "\"";
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

	private static String env(String key, Dotenv dotenv) {
		String fromSystem = System.getenv(key);
		if (fromSystem != null && !fromSystem.isBlank()) {
			return fromSystem;
		}
		String fromDotenv = dotenv.get(key);
		return (fromDotenv != null && !fromDotenv.isBlank()) ? fromDotenv : null;
	}
}
