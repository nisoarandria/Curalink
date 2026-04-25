# Atelier technique — Prise de rendez-vous (Patient)

## Objectif

Implémenter le parcours complet de prise de rendez-vous côté frontend pour le patient.

## Architecture API

### Endpoints publics (sans `/api`, sans auth)

| Méthode | URL | Réponse | Description |
|---------|-----|---------|-------------|
| GET | `/services` | `ServiceOptionResponse[]` | Liste des services |
| GET | `/services/{serviceId}/medecins` | `MedecinOptionResponse[]` | Médecins d'un service |
| GET | `/medecins/{medecinId}/disponibilites` | `MedecinDisponibiliteResponse[]` | Créneaux d'un médecin |
| GET | `/services/{serviceId}/disponibilites?date=YYYY-MM-DD` | `ServiceDisponibiliteResponse[]` | Créneaux rapides par service/date |

### Endpoint authentifié (Bearer PATIENT)

| Méthode | URL | Body | Réponse | Description |
|---------|-----|------|---------|-------------|
| POST | `/api/rendezvous` | `{ dateHeure, serviceId, medecinId }` | `RendezVousResponse` | Créer une demande de RDV (statut EN_ATTENTE) |

## Types backend (DTOs)

```typescript
// GET /services
type ServiceOptionResponse = {
  id: number
  nom: string
}

// GET /services/{serviceId}/medecins
type MedecinOptionResponse = {
  id: number
  nom: string
  specialite: string
}

// GET /medecins/{medecinId}/disponibilites
type MedecinDisponibiliteResponse = {
  date: string   // "YYYY-MM-DD"
  heure: string  // "HH:mm"
}

// GET /services/{serviceId}/disponibilites?date=...
type ServiceDisponibiliteResponse = {
  medecinId: number
  medecinNom: string
  heure: string  // "HH:mm"
}

// POST /api/rendezvous — request body
type CreateRendezVousRequest = {
  dateHeure: string  // "YYYY-MM-DDTHH:mm:ss" (ISO LocalDateTime, doit être dans le futur)
  serviceId: number
  medecinId: number
}

// POST /api/rendezvous — réponse
type RendezVousResponse = {
  id: number
  dateHeure: string
  status: "EN_ATTENTE" | "PROPOSE" | "CONFIRME" | "REFUSE" | "ANNULE" | "TERMINE" | "ABSENT"
  serviceId: number
  serviceNom: string
  patientId: number
  patientNomComplet: string
  medecinId: number
  medecinNomComplet: string
}
```

## Parcours utilisateur (3 étapes)

### Étape 1 — Choisir un service

- Appel : `GET /services`
- Afficher les services sous forme de cards cliquables
- Au clic → passer à l'étape 2

### Étape 2 — Deux parcours possibles

Le patient choisit entre **Parcours A** (par médecin) ou **Parcours B** (par créneau rapide).

#### Parcours A — Par médecin

1. Appel : `GET /services/{serviceId}/medecins` → afficher la liste des médecins
2. Option "Premier médecin disponible" ou sélection manuelle
3. Appel : `GET /medecins/{medecinId}/disponibilites` → afficher les créneaux du médecin
4. Le patient sélectionne un créneau (date + heure)
5. → Étape 3

#### Parcours B — Créneau rapide (par date)

1. Le patient choisit une date
2. Appel : `GET /services/{serviceId}/disponibilites?date=YYYY-MM-DD` → liste des médecins libres avec leurs horaires
3. Le patient sélectionne un créneau (medecinId + heure)
4. → Étape 3

### Étape 3 — Confirmer la demande

- Afficher le récapitulatif : service, médecin, date, heure
- Bouton "Confirmer"
- Appel : `POST /api/rendezvous` avec `{ dateHeure, serviceId, medecinId }`
- Le RDV est créé en statut `EN_ATTENTE`
- Afficher un message de succès

## Fichiers à créer/modifier

1. **`src/services/axiosInstance.ts`** — ajouter un `publicClient` (base URL sans `/api`) pour les endpoints publics
2. **`src/services/appointmentApi.ts`** — fonctions d'appel API dédiées au RDV
3. **`src/components/PatientDashboard.tsx`** — remplacer le wizard mock par le vrai parcours connecté à l'API

## Notes techniques

- Les endpoints publics (`/services`, `/medecins`) n'ont PAS le préfixe `/api` — ils sont montés à la racine du serveur
- Le `POST /api/rendezvous` nécessite un Bearer token PATIENT
- Le champ `dateHeure` doit être un `LocalDateTime` ISO dans le futur (ex: `"2026-04-25T09:00:00"`)
