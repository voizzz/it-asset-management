// src/app/components/AssetDistributionChart.tsx

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMemo } from 'react';

interface Agent {
  category: string;
}

interface Props {
  agents: Agent[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];

export default function AssetDistributionChart({ agents }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    agents.forEach((a) => {
      const cat = a.category || 'Other';
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [agents]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
