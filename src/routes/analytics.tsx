import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";
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

const chartTooltipStyle = {
  borderRadius: 16,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
};

function AnalyticsPage() {
  const { crops, activities, loading, error } = useHarvest();

  // Real monthly documentation trend, derived from stored activity records.
  const trend = useMemo(() => {
    const buckets = new Map<string, { month: string; records: number }>();
    for (const activity of activities) {
      const date = new Date(activity.date);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const current = buckets.get(key) ?? { month: label, records: 0 };
      current.records += 1;
      buckets.set(key, current);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([, value]) => value);
  }, [activities]);

  const byCrop = useMemo(() => crops.map((c) => ({ name: c.name, score: c.score })), [crops]);

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

      {!loading && crops.length === 0 ? (
        <div className="card-soft mt-6 grid place-items-center gap-3 p-16 text-center">
          <span className="text-5xl">📊</span>
          <p className="text-lg font-semibold">No data to analyse yet.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Register your first crop and record field activities to see real statistics here.
          </p>
          <Button asChild className="mt-2 rounded-2xl">
            <Link to="/crops/new">
              <Sprout className="size-4" /> Register crop
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card-soft p-5">
            <h3 className="text-base font-semibold">Documentation trend</h3>
            <p className="text-xs text-muted-foreground">Field activities recorded per month</p>
            <div className="mt-4 h-64">
              {loading ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Loading data…
                </div>
              ) : trend.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  No activities recorded yet.
                  <br />
                  Add a field note to start the trend.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="records"
                      stroke="var(--color-chart-1)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card-soft p-5">
            <h3 className="text-base font-semibold">Score by crop</h3>
            <p className="text-xs text-muted-foreground">Live traceability score per crop</p>
            <div className="mt-4 h-64">
              {loading ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Loading data…
                </div>
              ) : byCrop.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  No crops registered yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCrop}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                    <Tooltip
                      cursor={{ fill: "var(--color-muted)" }}
                      contentStyle={chartTooltipStyle}
                    />
                    <Bar dataKey="score" fill="var(--color-chart-1)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
