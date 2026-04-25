export type JourSemaine = "LUN" | "MAR" | "MER" | "JEU" | "VEN" | "SAM" | "DIM";

export type UpsertDisponibiliteRequest = {
  date: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  joursSemaine: JourSemaine[] | null;
  heureDebut: string;
  heureFin: string;
};

export type DisponibiliteDetailResponse = {
  id: number;
  date: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  joursSemaine: JourSemaine[] | null;
  heureDebut: string;
  heureFin: string;
  planningValide: boolean;
};
