import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

interface PaginatedTableProps<T> {
  data: T[]
  columns: { header: string; render: (item: T) => React.ReactNode }[]
  searchPlaceholder: string
  searchFn: (item: T, search: string) => boolean
  itemsPerPage?: number
}

function PaginatedTable<T extends { id?: string }>({
  data,
  columns,
  searchPlaceholder,
  searchFn,
  itemsPerPage = 5,
}: PaginatedTableProps<T>) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filtered = data.filter((item) => searchFn(item, search))
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  
  // Ensure page is within bounds when filtering
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 font-medium border-b">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y bg-card">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune donnée trouvée.
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} sur {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Contact</p>
              <p className="text-sm font-medium">{patient.contact}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            Antécédents médicaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {antecedentAction}
          <PaginatedTable<MedicalHistory>
            data={patient.antecedents}
            itemsPerPage={3}
            searchPlaceholder="Rechercher un antécédent..."
            searchFn={(item, search) => item.label.toLowerCase().includes(search.toLowerCase())}
            columns={[
              { header: "Description", render: (item) => <span className="font-medium">{item.label}</span> }
            ]}
          />
        </CardContent>
      </Card>

      {/* Constantes vitales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Suivi des constantes vitales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vitalAction}
          <PaginatedTable<VitalSign>
            data={patient.constantes}
            itemsPerPage={4}
            searchPlaceholder="Rechercher par date ou valeur..."
            searchFn={(item, search) => 
              item.date.includes(search) || 
              item.tension.includes(search) || 
              item.glycemie.includes(search) ||
              item.poids.includes(search)
            }
            columns={[
              { header: "Date", render: (item) => formatDateFrCompact(item.date) },
              { header: "Tension (mmHg)", render: (item) => <span className="font-semibold text-blue-600 dark:text-blue-400">{item.tension}</span> },
              { header: "Glycémie (g/L)", render: (item) => `${item.glycemie} g/L` },
              { header: "Poids (kg)", render: (item) => `${item.poids} kg` },
              { header: "IMC", render: (item) => (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${Number(item.imc) > 25 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                  {item.imc}
                </span>
              ) },
            ]}
          />
        </CardContent>
      </Card>

      {/* Historique des consultations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
            Historique des consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaginatedTable<ConsultationNote>
            data={patient.historiqueConsultations}
            itemsPerPage={3}
            searchPlaceholder="Rechercher par date, motif ou diagnostic..."
            searchFn={(item, search) => {
              const term = search.toLowerCase()
              return item.date.includes(term) || 
                     item.motif.toLowerCase().includes(term) || 
                     item.diagnostic.toLowerCase().includes(term)
            }}
            columns={[
              { header: "Date", render: (item) => <span className="whitespace-nowrap">{formatDateFrCompact(item.date)}</span> },
              { header: "Motif", render: (item) => <span className="font-medium">{item.motif}</span> },
              { header: "Diagnostic", render: (item) => <span className="text-muted-foreground">{item.diagnostic}</span> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
