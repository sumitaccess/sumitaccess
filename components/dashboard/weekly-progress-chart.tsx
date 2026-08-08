"use client";

import * as React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Skeleton } from "../ui";

export function WeeklyProgressChart({ userId }: { userId: string }) {
  const [data, setData] = React.useState<{ day: string; count: number }[] | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/sessions/activity?userId=${userId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data.weeks);
      })
      .catch(() => setData([]));
    return () => controller.abort();
  }, [userId]);

  if (!data) return <Skeleton className="h-[220px] w-full rounded-2xl" />;
  if (data.every((d) => d.count === 0)) {
    return (
      <Card className="flex h-[220px] items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No sessions yet. Book one this week and watch your progress grow 📈
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -26, bottom: 0 }}>
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            cursor={{ fill: "hsl(var(--secondary))" }}
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
            formatter={(v) => [`${v} session${Number(v) === 1 ? "" : "s"}`, "Sessions"]}
          />
          <Bar dataKey="count" radius={[6, 6, 2, 2]} fill="hsl(var(--primary))" maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
