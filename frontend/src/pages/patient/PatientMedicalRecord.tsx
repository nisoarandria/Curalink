import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PaginatedDataTable } from "@/components/ui/data-table"
import {
  Activity01Icon,
  CallIcon,
  File01Icon,
  Icon,
  Location01Icon,
  SecurityCheckIcon,
  UserGroupIcon,
} from "@/components/ui/icon"

const formatDateFrCompact = (value: string) => {
  if (!value || value === "-") return value || "-"
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  const monthIndex = Number(month) - 1
  const months = [
    "Janvier",
    "Fevrier",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Aout",
    "Septembre",
    "Octobre",
    "Novembre",
    "Decembre",
  ]
  const monthLabel = months[monthIndex]
  if (!monthLabel) return value
  return `${day} ${monthLabel} ${year}`
}

export type VitalSign = {
  id?: string
  date: string
  tension: string
  glycemie: string
  poids: string
  imc: string
}

export type MedicalHistory = {
  id: string
  label: string
}

export type ConsultationNote = {
  id?: string
  rendezVousId?: string
  date: string
  motif: string
  diagnostic: string
}

export type PatientRecord = {
  id: string
  nom: string
  prenom: string
  sexe: string
  dateNaissance: string
  numeroDossier: string
  contact: string
  adresse: string
  antecedents: MedicalHistory[]
  constantes: VitalSign[]
  historiqueConsultations: ConsultationNote[]
}

export function PatientRecordView({ 
  patient,
  antecedentAction,
  vitalAction
}: { 
  patient: PatientRecord
  antecedentAction?: React.ReactNode
  vitalAction?: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <Card>
        <CardHeader className="bg-primary/5 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">
                {patient.nom} {patient.prenom}
              </CardTitle>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Dossier: {patient.numeroDossier}</span>
                <span>•</span>
                <span>{patient.sexe === "M" ? "Homme" : "Femme"}</span>
                <span>•</span>
                <span>Né(e) le {formatDateFrCompact(patient.dateNaissance)}</span>
              </div>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Icon icon={UserGroupIcon} className="size-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Icon icon={CallIcon} className="size-[18px] text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Contact</p>
              <p className="text-sm font-medium">{patient.contact}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Icon icon={Location01Icon} className="size-[18px] text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Adresse</p>
              <p className="text-sm font-medium">{patient.adresse}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Antécédents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon icon={SecurityCheckIcon} className="size-5 text-primary" />
            Antécédents médicaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {antecedentAction}
          <PaginatedDataTable<MedicalHistory>
            data={patient.antecedents}
            itemsPerPage={3}
            searchPlaceholder="Rechercher un antécédent…"
            searchFilter={(item, search) =>
              item.label.toLowerCase().includes(search.toLowerCase())
            }
            columns={[
              {
                header: "Description",
                cell: (item) => <span className="font-medium">{item.label}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Constantes vitales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon icon={Activity01Icon} className="size-5 text-primary" />
            Suivi des constantes vitales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vitalAction}
          <PaginatedDataTable<VitalSign>
            data={patient.constantes}
            itemsPerPage={4}
            searchPlaceholder="Rechercher par date ou valeur…"
            searchFilter={(item, search) =>
              item.date.includes(search) ||
              item.tension.includes(search) ||
              item.glycemie.includes(search) ||
              item.poids.includes(search)
            }
            columns={[
              { header: "Date", cell: (item) => formatDateFrCompact(item.date) },
              {
                header: "Tension (mmHg)",
                cell: (item) => (
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {item.tension}
                  </span>
                ),
              },
              { header: "Glycémie (g/L)", cell: (item) => `${item.glycemie} g/L` },
              { header: "Poids (kg)", cell: (item) => `${item.poids} kg` },
              {
                header: "IMC",
                cell: (item) => (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      Number(item.imc) > 25
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    }`}
                  >
                    {item.imc}
                  </span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Historique des consultations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon icon={File01Icon} className="size-5 text-primary" />
            Historique des consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaginatedDataTable<ConsultationNote>
            data={patient.historiqueConsultations}
            itemsPerPage={3}
            searchPlaceholder="Rechercher par date, motif ou diagnostic…"
            searchFilter={(item, search) => {
              const term = search.toLowerCase();
              return (
                item.date.includes(term) ||
                item.motif.toLowerCase().includes(term) ||
                item.diagnostic.toLowerCase().includes(term)
              );
            }}
            columns={[
              {
                header: "Date",
                cell: (item) => (
                  <span className="whitespace-nowrap">
                    {formatDateFrCompact(item.date)}
                  </span>
                ),
              },
              {
                header: "Motif",
                cell: (item) => <span className="font-medium">{item.motif}</span>,
              },
              {
                header: "Diagnostic",
                cell: (item) => (
                  <span className="text-muted-foreground">{item.diagnostic}</span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
