import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  DisponibiliteDetailResponse,
  JourSemaine,
  UpsertDisponibiliteRequest,
} from "@/types/disponibilites";

type FormMode = "unitaire" | "recurrent";

type FormValues = {
  date: string;
  dateDebut: string;
  dateFin: string;
  joursSemaine: JourSemaine[];
  heureDebut: string;
  heureFin: string;
};

type Props = {
  editingItem: DisponibiliteDetailResponse | null;
  onSubmit: (payload: UpsertDisponibiliteRequest) => Promise<void>;
  onCancelEdit: () => void;
  isSubmitting: boolean;
};

const JOURS_OPTIONS: { value: JourSemaine; label: string }[] = [
  { value: "LUN", label: "Lun" },
  { value: "MAR", label: "Mar" },
  { value: "MER", label: "Mer" },
  { value: "JEU", label: "Jeu" },
  { value: "VEN", label: "Ven" },
  { value: "SAM", label: "Sam" },
  { value: "DIM", label: "Dim" },
];

const EMPTY_VALUES: FormValues = {
  date: "",
  dateDebut: "",
  dateFin: "",
  joursSemaine: [],
  heureDebut: "",
  heureFin: "",
};

export default function DisponibiliteForm({
  editingItem,
  onSubmit,
  onCancelEdit,
  isSubmitting,
}: Props) {
  const [mode, setMode] = useState<FormMode>("unitaire");
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingItem) {
      setMode("unitaire");
      setValues(EMPTY_VALUES);
      setErrors({});
      setSubmitError(null);
      return;
    }

    const isRecurring =
      !!editingItem.dateDebut &&
      !!editingItem.dateFin &&
      (editingItem.joursSemaine?.length ?? 0) > 0;

    setMode(isRecurring ? "recurrent" : "unitaire");
    setValues({
      date: editingItem.date ?? "",
      dateDebut: editingItem.dateDebut ?? "",
      dateFin: editingItem.dateFin ?? "",
      joursSemaine: editingItem.joursSemaine ?? [],
      heureDebut: editingItem.heureDebut,
      heureFin: editingItem.heureFin,
    });
    setErrors({});
    setSubmitError(null);
  }, [editingItem]);

  const title = useMemo(
    () =>
      editingItem ? "Modifier une disponibilité" : "Ajouter une disponibilité",
    [editingItem],
  );

  const handleDayToggle = (day: JourSemaine) => {
    setValues((prev) => ({
      ...prev,
      joursSemaine: prev.joursSemaine.includes(day)
        ? prev.joursSemaine.filter((d) => d !== day)
        : [...prev.joursSemaine, day],
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const start = values.heureDebut;
    const end = values.heureFin;

    if (!start) nextErrors.heureDebut = "L'heure de début est obligatoire.";
    if (!end) nextErrors.heureFin = "L'heure de fin est obligatoire.";
    if (start && end && end <= start) {
      nextErrors.heureFin =
        "L'heure de fin doit être strictement supérieure à l'heure de début.";
    }

    if (mode === "unitaire") {
      if (!values.date) nextErrors.date = "La date est obligatoire en mode unitaire.";
    }

    if (mode === "recurrent") {
      if (!values.dateDebut) {
        nextErrors.dateDebut = "La date de début est obligatoire.";
      }
      if (!values.dateFin) {
        nextErrors.dateFin = "La date de fin est obligatoire.";
      }
      if (values.dateDebut && values.dateFin && values.dateFin < values.dateDebut) {
        nextErrors.dateFin =
          "La date de fin doit être supérieure ou égale à la date de début.";
      }
      if (values.joursSemaine.length === 0) {
        nextErrors.joursSemaine =
          "Sélectionnez au moins un jour de semaine en mode récurrent.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;

    const payload: UpsertDisponibiliteRequest =
      mode === "unitaire"
        ? {
            date: values.date,
            dateDebut: null,
            dateFin: null,
            joursSemaine: null,
            heureDebut: values.heureDebut,
            heureFin: values.heureFin,
          }
        : {
            date: null,
            dateDebut: values.dateDebut,
            dateFin: values.dateFin,
            joursSemaine: values.joursSemaine,
            heureDebut: values.heureDebut,
            heureFin: values.heureFin,
          };

    try {
      await onSubmit(payload);
      if (!editingItem) {
        setValues(EMPTY_VALUES);
      }
      setErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Échec de l'envoi.");
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={mode === "unitaire" ? "default" : "outline"}
            onClick={() => setMode("unitaire")}
            disabled={isSubmitting}
          >
            Saisie unitaire
          </Button>
          <Button
            type="button"
            variant={mode === "recurrent" ? "default" : "outline"}
            onClick={() => setMode("recurrent")}
            disabled={isSubmitting}
          >
            Saisie récurrente
          </Button>
        </div>

        {mode === "unitaire" && (
          <div className="space-y-2">
            <Label htmlFor="disp-date">Date</Label>
            <Input
              id="disp-date"
              type="date"
              value={values.date}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, date: e.target.value }))
              }
              disabled={isSubmitting}
            />
            {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
          </div>
        )}

        {mode === "recurrent" && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="disp-date-debut">Date début</Label>
                <Input
                  id="disp-date-debut"
                  type="date"
                  value={values.dateDebut}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, dateDebut: e.target.value }))
                  }
                  disabled={isSubmitting}
                />
                {errors.dateDebut && (
                  <p className="text-xs text-red-600">{errors.dateDebut}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="disp-date-fin">Date fin</Label>
                <Input
                  id="disp-date-fin"
                  type="date"
                  value={values.dateFin}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, dateFin: e.target.value }))
                  }
                  disabled={isSubmitting}
                />
                {errors.dateFin && (
                  <p className="text-xs text-red-600">{errors.dateFin}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jours de semaine</Label>
              <div className="flex flex-wrap gap-2">
                {JOURS_OPTIONS.map((day) => {
                  const checked = values.joursSemaine.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      disabled={isSubmitting}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              {errors.joursSemaine && (
                <p className="text-xs text-red-600">{errors.joursSemaine}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="disp-heure-debut">Heure début</Label>
            <Input
              id="disp-heure-debut"
              type="time"
              value={values.heureDebut}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, heureDebut: e.target.value }))
              }
              disabled={isSubmitting}
            />
            {errors.heureDebut && (
              <p className="text-xs text-red-600">{errors.heureDebut}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="disp-heure-fin">Heure fin</Label>
            <Input
              id="disp-heure-fin"
              type="time"
              value={values.heureFin}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, heureFin: e.target.value }))
              }
              disabled={isSubmitting}
            />
            {errors.heureFin && (
              <p className="text-xs text-red-600">{errors.heureFin}</p>
            )}
          </div>
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Envoi..."
              : editingItem
                ? "Mettre à jour"
                : "Créer la disponibilité"}
          </Button>
          {editingItem && (
            <Button
              variant="outline"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              Annuler édition
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
