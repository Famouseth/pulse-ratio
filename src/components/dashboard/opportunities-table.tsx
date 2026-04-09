"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from "@tanstack/react-table";
import { useState } from "react";
import type { Opportunity } from "@/types";
import { formatUsd } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const helper = createColumnHelper<Opportunity>();

interface Props {
  data: Opportunity[];
  isLoading?: boolean;
}

export function OpportunitiesTable({ data, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "score", desc: true }]);

  const columns = useMemo(
    () => [
      helper.accessor("protocol", {
        header: "Protocol",
        enableSorting: true
      }),
      helper.accessor("chain", {
        header: "Chain",
        enableSorting: true
      }),
      helper.accessor("type", {
        header: "Type",
        enableSorting: true,
        cell: (info) => <Badge variant={info.getValue() === "Lending" ? "success" : "warning"}>{info.getValue()}</Badge>
      }),
      helper.accessor("symbol", {
        header: "Pair/Asset",
        enableSorting: true
      }),
      helper.accessor("tvlUsd", {
        header: "TVL",
        enableSorting: true,
        cell: (info) => formatUsd(info.getValue(), 1)
      }),
      helper.accessor("apy", {
        header: "APY",
        enableSorting: true,
        cell: (info) => `${info.getValue().toFixed(2)}%`
      }),
      helper.accessor("fees24h", {
        header: "Fees/Int 24h",
        enableSorting: true,
        cell: (info) => formatUsd(info.getValue(), 1)
      }),
      helper.accessor("ilEstimate", {
        header: "IL",
        enableSorting: true,
        cell: (info) => info.getValue().toFixed(1)
      }),
      helper.accessor("lvrEstimate", {
        header: "LVR",
        enableSorting: true,
        cell: (info) => info.getValue().toFixed(1)
      }),
      helper.accessor("score", {
        header: "Score",
        enableSorting: true,
        cell: (info) => info.getValue().toFixed(2)
      })
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-2">
            <span className="text-2xl">ðŸ“Š</span>
            <p>No pools match the active filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    return (
                      <TableHead
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={canSort ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            sorted === "asc"  ? <ArrowUp   className="h-3 w-3 text-primary" /> :
                            sorted === "desc" ? <ArrowDown className="h-3 w-3 text-primary" /> :
                                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </span>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
