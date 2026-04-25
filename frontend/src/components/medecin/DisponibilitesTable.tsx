import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DisponibiliteDetailResponse } from "@/types/disponibilites";

type Props = {
  items: DisponibiliteDetailResponse[];
  isLoading: boolean;
  onEdit: (item: DisponibiliteDetailResponse) => void;
  onDelete: (item: DisponibiliteDetailResponse) => void;
  disableActions?: boolean;
};

const JOUR_LABELS: Record<string, string> = {
  LUN: "Lun",
  MAR: "Mar",
  MER: "Mer",
  JEU: "Jeu",
  VEN: "Ven",
  SAM: "Sam",
  DIM: "Dim",
};

function formatPeriode(item: DisponibiliteDetailResponse) {
  if (item.date) return item.date;
  if (item.dateDebut && item.dateFin) return `${item.dateDebut} -> ${item.dateFin}`;
  return "-";
}

function formatJours(item: DisponibiliteDetailResponse) {
  if (!item.joursSemaine || item.joursSemaine.length === 0) return "-";
  return item.joursSemaine.map((j) => JOUR_LABELS[j] ?? j).join(", ");
}

export default function DisponibilitesTable({
  items,
  isLoading,
  onEdit,
  onDelete,
  disableActions = false,
}: Props) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Mes disponibilités</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Chargement des disponibilités...
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Aucune disponibilité enregistrée.
          </div>
        )}

        {!isLoading &&
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/60 bg-white p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Période:</span>{" "}
                    {formatPeriode(item)}
                  </p>
                  <p>
                    <span className="font-semibold">Jours:</span>{" "}
                    {formatJours(item)}
                  </p>
                  <p>
                    <span className="font-semibold">Heures:</span>{" "}
                    {item.heureDebut} - {item.heureFin}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.planningValide
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.planningValide ? "Validé" : "En attente"}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      disabled={disableActions}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(item)}
                      disabled={disableActions}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
