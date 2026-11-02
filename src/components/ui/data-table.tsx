"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Checkbox } from "./controls";
import { EmptyState } from "./misc";
import { Button } from "./button";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
  /** Hide below the md breakpoint */
  hideOnMobile?: boolean;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchText,
  searchPlaceholder = "Search…",
  toolbar,
  pageSize = 10,
  onRowClick,
  empty,
  selectable,
  bulkActions,
  initialSort,
  className,
  dense,
}: {
  rows: T[];
  columns: Column<T>[];
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  empty?: { title: string; description?: string; icon?: React.ReactNode; action?: React.ReactNode };
  selectable?: boolean;
  bulkActions?: (ids: string[], clear: () => void) => React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  className?: string;
  dense?: boolean;
}) {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState(initialSort ?? null);
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = needle && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(needle)) : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const sv = col.sortValue;
        out = [...out].sort((a, b) => {
          const x = sv(a);
          const y = sv(b);
          const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, q, sort, columns, searchText]);

  React.useEffect(() => setPage(0), [q, rows.length]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const allOnPage = view.length > 0 && view.every((r) => selected.has(r.id));
  const someOnPage = view.some((r) => selected.has(r.id));
  const clear = () => setSelected(new Set());

  const toggleSort = (key: string) =>
    setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-white shadow-card", className)}>
      {(searchText || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-line p-3 lg:flex-row lg:items-center">
          {searchText && (
            <div className="lg:w-72">
              <Input icon={<Search />} placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search table" />
            </div>
          )}
          {toolbar && <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">{toolbar}</div>}
        </div>
      )}
      {selectable && selected.size > 0 && bulkActions && (
        <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 bg-brand-50/60 px-4 py-2 text-[13px] animate-fade-in">
          <span className="font-medium text-brand-800">{selected.size} selected</span>
          <div className="flex flex-wrap gap-2">{bulkActions([...selected], clear)}</div>
          <button className="ml-auto text-xs font-medium text-ink-3 hover:text-ink" onClick={clear}>
            Clear selection
          </button>
        </div>
      )}
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-subtle/80">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    aria-label="Select all on page"
                    checked={allOnPage}
                    indeterminate={!allOnPage && someOnPage}
                    onCheckedChange={(v) =>
                      setSelected((s) => {
                        const n = new Set(s);
                        view.forEach((r) => (v ? n.add(r.id) : n.delete(r.id)));
                        return n;
                      })
                    }
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.hideOnMobile && "hidden md:table-cell",
                    c.headerClassName,
                  )}
                >
                  {c.sortValue ? (
                    <button className={cn("inline-flex items-center gap-1 uppercase hover:text-ink", c.align === "right" && "flex-row-reverse")} onClick={() => toggleSort(c.key)}>
                      {c.header}
                      {sort?.key === c.key ? sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "group border-b border-line/70 transition-colors last:border-0",
                  onRowClick && "cursor-pointer hover:bg-brand-50/40",
                  selected.has(row.id) && "bg-brand-50/50",
                )}
              >
                {selectable && (
                  <td className="px-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label="Select row"
                      checked={selected.has(row.id)}
                      onCheckedChange={(v) =>
                        setSelected((s) => {
                          const n = new Set(s);
                          if (v) n.add(row.id);
                          else n.delete(row.id);
                          return n;
                        })
                      }
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 align-middle text-ink-2",
                      dense ? "py-2" : "py-3",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.hideOnMobile && "hidden md:table-cell",
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {view.length === 0 && (
          <EmptyState
            compact
            icon={empty?.icon ?? <SearchX />}
            title={q ? `No results for “${q}”` : empty?.title ?? "Nothing here yet"}
            description={q ? "Try a different search term or clear the filters." : empty?.description}
            action={q ? <Button variant="secondary" size="sm" onClick={() => setQ("")}>Clear search</Button> : empty?.action}
          />
        )}
      </div>
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-ink-3">
          <span>
            Showing <span className="font-medium text-ink-2">{page * pageSize + 1}–{Math.min(filtered.length, (page + 1) * pageSize)}</span> of{" "}
            <span className="font-medium text-ink-2">{filtered.length}</span>
          </span>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            <span className="px-2 tabular-nums">
              {page + 1} / {pages}
            </span>
            <Button variant="secondary" size="icon-xs" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
