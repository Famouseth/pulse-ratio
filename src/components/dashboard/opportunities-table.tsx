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

const helper = createColumnHelper<Opportunity>();

interface Props {
  data: Opportunity[];
  isLoading?: boolean;
}

export function OpportunitiesTable({ data, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "score", desc: true }]);

  const columns = useMemo(
    () => [
      helper.accessor("protocol", { header: "Protocol" }),
      helper.accessor("chain", { header: "Chain" }),
      helper.accessor("type", {
        header: "Type",
        cell: (info) => <Badge variant={info.getValue() === "Lending" ? "success" : "warning"}>{info.getValue()}</Badge>
      }),
      helper.accessor("symbol", { header: "Pair/Asset" }),
      helper.accessor("tvlUsd", { header: "TVL", cell: (info) => formatUsd(info.getValue(), 1) }),
      helper.accessor("apy", { header: "APY", cell: (info) => `${info.getValue().toFixed(2)}%` }),
      helper.accessor("fees24h", { header: "Fees/Int 24h", cell: (info) => formatUsd(info.getValue(), 1) }),
      helper.accessor("ilEstimate", { header: "IL" }),
      helper.accessor("lvrEstimate", { header: "LVR" }),
      helper.accessor("score", { header: "Score", cell: (info) => info.getValue().toFixed(2) })
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
            <span className="text-2xl">📊</span>
            <p>No pools found. Data loads from DefiLlama — refresh in a moment.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                  ))}
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
