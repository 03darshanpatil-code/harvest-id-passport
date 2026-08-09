import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { useHarvest } from "@/lib/harvest-store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Farm Analytics — HarvestID" },
      {
        name: "description",
        content: "See documentation trends and traceability scores across all of your crops.",
      },
      { property: "og:title", content: "Farm Analytics — HarvestID" },
      { property: "og:description", content: "Track how well each harvest is documented." },
    ],
  }),
  component: AnalyticsPage,
});

const trend = [
  { month: "Feb", records: 6, score: 62 },
  { month: "Mar", records: 9, score: 71 },
  { month: "Apr", records: 12, score: 78 },
  { month: "May", records: 15, score: 84 },
  { month: "Jun", records: 18, score: 89 },
  { month: "Jul", records: 22, score: 94 },
];

function AnalyticsPage() {
  const { crops, activities, loading, error } = useHarvest();
  const byCrop = crops.map((c) => ({ name: c.name, score: c.score }));
  const trend = crops.length
    ? [
        { month: "Now", records: activities.length, score: Math.round(crops.reduce((sum, crop) => sum + crop.score, 0) / Math.max(crops.length, 1)) },
      ]
    : [];

  return (
    <AppLayout title="Analytics" subtitle="Documentation performance">
      <h2 className="font-display text-2xl font-semibold">Farm analytics</h2>
      <p className="text-sm text-muted-foreground">
        Traceability improves as you record more field activity.
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card-soft p-5">
          <h3 className="text-base font-semibold">Traceability trend</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loading && trend.length === 0 ? [{ month: "Loading", records: 0, score: 0 }] : trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-chart-1)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft p-5">
          <h3 className="text-base font-semibold">Score by crop</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCrop}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Bar dataKey="score" fill="var(--color-chart-1)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
