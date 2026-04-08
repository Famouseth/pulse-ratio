"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  btc: number;
  eth: number;
}

export function TvlBreakdownChart({ btc, eth }: Props) {
  const data = [
    { name: "BTC", value: btc, color: "#F7931A" },
    { name: "ETH", value: eth, color: "#5B7FFF" }
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" dataKey="value" nameKey="name" innerRadius={70} outerRadius={100}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(10,12,24,0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
