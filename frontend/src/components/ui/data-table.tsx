import { useMemo, useState, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id?: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

const tableWrapperVariants = cva("overflow-x-auto rounded-xl border border-border/60", {
  variants: {
    variant: {
      default: "",
      plain: "rounded-md border-border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type DataTableProps<T> = VariantProps<typeof tableWrapperVariants> & {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey?: (item: T, index: number) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
  minWidth?: string;
  className?: string;
  tableClassName?: string;
  rowClassName?: string;
};

function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Aucun enregistrement disponible pour le moment.",
  minWidth = "100%",
  variant = "default",
  className,
  tableClassName,
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className={cn(tableWrapperVariants({ variant }), className)}>
      <table
        className={cn("w-full text-sm text-left", tableClassName)}
        style={{ minWidth }}
      >
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.id ?? column.header ?? index}
                className={cn("px-4 py-3 font-medium", column.headerClassName)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={variant === "plain" ? "divide-y bg-card" : undefined}>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-2">
                <EmptyState
                  variant="table"
                  size="sm"
                  title={emptyTitle}
                  description={emptyDescription}
                />
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={getRowKey?.(item, index) ?? index}
                className={cn(
                  "border-t border-border/50 transition-colors hover:bg-muted/30",
                  rowClassName,
                )}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.id ?? column.header ?? colIndex}
                    className={cn("px-4 py-3", column.className)}
                  >
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

type PaginatedDataTableProps<T> = Omit<
  DataTableProps<T>,
  "data" | "emptyTitle" | "emptyDescription"
> & {
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, search: string) => boolean;
  itemsPerPage?: number;
  showResultCount?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

function PaginatedDataTable<T extends { id?: string }>({
  data,
  columns,
  searchPlaceholder = "Rechercher…",
  searchFilter,
  itemsPerPage = 5,
  showResultCount = true,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Aucun enregistrement ne correspond à votre recherche.",
  getRowKey,
  ...tableProps
}: PaginatedDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!searchFilter || !search.trim()) return data;
    return data.filter((item) => searchFilter(item, search));
  }, [data, search, searchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <SearchBar
          placeholder={searchPlaceholder}
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          containerClassName="w-full max-w-sm"
        />
        {showResultCount && (
          <div className="text-sm text-muted-foreground">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        getRowKey={getRowKey ?? ((item, index) => item.id ?? index)}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        variant="plain"
        {...tableProps}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
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
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}

export { DataTable, PaginatedDataTable };
