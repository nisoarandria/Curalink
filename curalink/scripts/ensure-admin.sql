-- Crée un compte administrateur uniquement s'il n'existe pas encore (même email).
-- SQL Editor Supabase ou : psql "$DATABASE_URL" -f scripts/ensure-admin.sql
--
-- Mot de passe associé au hash ci-dessous (EXEMPLE — à changer en production) :
--   ChangeMeAdmin2026!
--
-- Pour générer un autre hash bcrypt (même algo que Spring / BCrypt 10 rounds), en Java :
--   mvn -q compile exec:java -Dexec.mainClass=com.curalink.cli.EnsureAdminCli -Dexec.args="--bcrypt VotreMotDePasse"
--
-- Remplacez admin@curalink.local aux deux endroits si vous changez l'email.

INSERT INTO users (
    user_type,
    nom,
    prenom,
    email,
    telephone,
    adresse,
    photo_profile,
    password_hash,
    date_naissance,
    sexe
)
SELECT
    'ADMIN',
    'Admin',
    'Principal',
    'admin@curalink.local',
    NULL,
    NULL,
    NULL,
    '$2b$10$In2lBL0d1t.R9VIMw1R8tOBUVWb.DHVC74Rb3Hf3IMyy4B6ZNg9Mq',
    NULL,
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE lower(u.email) = lower('admin@curalink.local')
);
