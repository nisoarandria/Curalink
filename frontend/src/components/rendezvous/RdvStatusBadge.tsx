import type { RendezVousStatus } from "@/services/appointmentApi";

export const RDV_STATUS_CONFIG: Record<
  RendezVousStatus,
  { label: string; className: string }
> = {
  EN_ATTENTE: {
    label: "En attente",
    className: "bg-yellow-100 text-yellow-800",
  },
  PROPOSE: { label: "Proposé", className: "bg-blue-100 text-blue-800" },
  CONFIRME: { label: "Confirmé", className: "bg-green-100 text-green-800" },
  REFUSE: { label: "Refusé", className: "bg-red-100 text-red-800" },
  ANNULE: { label: "Annulé", className: "bg-gray-100 text-gray-800" },
  TERMINE: { label: "Terminé", className: "bg-purple-100 text-purple-800" },
  ABSENT: { label: "Absent", className: "bg-orange-100 text-orange-800" },
};

export function RdvStatusBadge({ status }: { status: RendezVousStatus }) {
  const cfg = RDV_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
