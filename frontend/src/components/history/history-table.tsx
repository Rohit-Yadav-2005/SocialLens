"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { StatusBadge } from "@/components/history/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { scoreLabel } from "@/lib/score-utils";
import type { HistoryRow } from "@/hooks/use-history";

type SortKey = "filename" | "overallScore" | "status" | "created_at";
type SortDirection = "asc" | "desc";

const DEFAULT_SORT_DIRECTION: Record<SortKey, SortDirection> = {
  filename: "asc",
  overallScore: "desc",
  status: "asc",
  created_at: "desc",
};

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "filename", label: "Filename" },
  { key: "overallScore", label: "Score" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Date" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function compareRows(a: HistoryRow, b: HistoryRow, key: SortKey): number {
  switch (key) {
    case "filename":
      return a.filename.localeCompare(b.filename);
    case "status":
      return a.status.localeCompare(b.status);
    case "created_at":
      return a.created_at.localeCompare(b.created_at);
    case "overallScore":
      return (a.overallScore ?? -1) - (b.overallScore ?? -1);
  }
}

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? rows.filter((row) => row.filename.toLowerCase().includes(query))
      : rows;

    const sorted = [...filtered].sort((a, b) => {
      const result = compareRows(a, b, sortKey);
      return sortDirection === "asc" ? result : -result;
    });
    return sorted;
  }, [rows, search, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(DEFAULT_SORT_DIRECTION[key]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by filename…"
          className="pl-9"
          aria-label="Search analyses by filename"
        />
      </div>

      <div className="shadow-2 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {COLUMNS.map((column) => {
                const isActive = sortKey === column.key;
                const Icon = isActive
                  ? sortDirection === "asc"
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown;
                return (
                  <th key={column.key} scope="col" className="px-4 py-3 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className={cn(
                        "flex items-center gap-1.5 transition-colors hover:text-foreground",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {column.label}
                      <Icon className="size-3.5" aria-hidden="true" />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/30"
              >
                <td className="p-0">
                  <Link
                    href={`/analyze/${row.id}`}
                    className="block truncate px-4 py-3.5 font-medium text-foreground transition-colors hover:text-primary"
                    title={row.filename}
                  >
                    {row.filename}
                  </Link>
                </td>
                <td
                  data-numeric
                  className="px-4 py-3.5 font-medium"
                  style={{
                    color:
                      row.overallScore !== null
                        ? scoreLabel(row.overallScore).colorVar
                        : "var(--muted-foreground)",
                  }}
                >
                  {row.overallScore !== null ? `${row.overallScore}/100` : "—"}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{formatDate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleRows.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No analyses match &ldquo;{search}&rdquo;.
        </p>
      )}
    </div>
  );
}
