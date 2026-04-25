import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import DisponibiliteForm from "@/components/medecin/DisponibiliteForm";
import DisponibilitesTable from "@/components/medecin/DisponibilitesTable";
import {
  createDisponibilite,
  deleteDisponibilite,
  fetchMesDisponibilites,
  getDisponibiliteApiErrorMessage,
  updateDisponibilite,
} from "@/services/disponibilitesApi";
import type {
  DisponibiliteDetailResponse,
  UpsertDisponibiliteRequest,
} from "@/types/disponibilites";

type ToastType = "success" | "error";

type ToastState = {
  message: string;
  type: ToastType;
} | null;

export default function MedecinDisponibilitesPage() {
  const [items, setItems] = useState<DisponibiliteDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<DisponibiliteDetailResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DisponibiliteDetailResponse | null>(
    null,
  );
  const [toast, setToast] = useState<ToastState>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aDate = a.dateDebut ?? a.date ?? "";
        const bDate = b.dateDebut ?? b.date ?? "";
        const dateCompare = aDate.localeCompare(bDate);
        if (dateCompare !== 0) return dateCompare;
        return a.heureDebut.localeCompare(b.heureDebut);
      }),
    [items],
  );

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const data = await fetchMesDisponibilites();
      setItems(data);
    } catch (error) {
      const message = getDisponibiliteApiErrorMessage(error);
      setPageError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (payload: UpsertDisponibiliteRequest) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateDisponibilite(editingItem.id, payload);
        showToast("Disponibilité mise à jour avec succès.", "success");
      } else {
        await createDisponibilite(payload);
        showToast("Disponibilité créée avec succès.", "success");
      }
      setEditingItem(null);
      await loadData();
    } catch (error) {
      const message = getDisponibiliteApiErrorMessage(error);
      showToast(message, "error");
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteDisponibilite(deleteTarget.id);
      showToast("Disponibilité supprimée.", "success");
      if (editingItem?.id === deleteTarget.id) {
        setEditingItem(null);
      }
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      showToast(getDisponibiliteApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DisponibiliteForm
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingItem(null)}
          isSubmitting={isSubmitting}
        />
        <DisponibilitesTable
          items={sortedItems}
          isLoading={isLoading}
          onEdit={setEditingItem}
          onDelete={setDeleteTarget}
          disableActions={isSubmitting}
        />
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-xl">
            <h3 className="text-base font-semibold">Confirmer la suppression</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Voulez-vous vraiment supprimer cette disponibilité ?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirmed}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
