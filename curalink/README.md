# Curalink API

API Spring Boot du projet `Curalink`.

## Prerequis

- Java 17
- Spring Boot 3.5.13
- Maven Wrapper inclus dans le projet (`./mvnw`)

## Configuration

L'application charge ses variables d'environnement depuis le fichier `.env` tu copie les données de  `.env.txt` et tu le met dans .env.

Exemple de variables attendues :

- `SUPABASE_JDBC_URL`
- `SUPABASE_DB_USERNAME`
- `SUPABASE_DB_PASSWORD`
- `APP_ADMIN_EMAIL`
- `APP_ADMIN_PASSWORD`
- `APP_JWT_SECRET`
- `APP_JWT_EXPIRATION_MS`
- `GEMINI_API_KEY`

## Demarrer l'API

Depuis le dossier du projet :

```bash
cd curalink
./mvnw spring-boot:run
```

L'API demarre par defaut sur le port `8080`.

## Lancer les tests

```bash
cd curalink
./mvnw test
```

## Construire l'application

```bash
cd curalink
./mvnw clean package
```

## Executer le jar genere

Apres le build :

```bash
cd curalink
java -jar target/curalink-0.0.1-SNAPSHOT.jar
```

## Commande pour reset database
```bash
RESET_DB_CONFIRM=YES mvn exec:java@reset-database
```
