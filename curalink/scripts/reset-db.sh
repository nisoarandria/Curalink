#!/usr/bin/env bash
set -euo pipefail

# Charge automatiquement les variables locales du projet (.env) si présent.
if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

if [[ "${RESET_DB_CONFIRM:-}" != "YES" ]]; then
  echo "Action bloquée: export RESET_DB_CONFIRM=YES pour confirmer la suppression totale."
  exit 1
fi

mvn -q compile exec:java@reset-database
