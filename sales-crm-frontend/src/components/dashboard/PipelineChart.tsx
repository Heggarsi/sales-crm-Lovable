import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PipelineData {
  name: string;
  value: number;
  color?: string;
}

interface PipelineChartProps {
  data?: PipelineData[];
}

const defaultColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--success))",
  "hsl(var(--destructive))"
];

// Helper function to truncate name before '/'
const truncateName = (name: string): string => {
  const slashIndex = name.indexOf('/');
  return slashIndex !== -1 ? name.substring(0, slashIndex).trim() : name;
};

export function PipelineChart({ data = [] }: PipelineChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    name: truncateName(item.name),
    color: item.color || defaultColors[index % defaultColors.length]
  }));

  return (
    <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Sales Pipeline</h3>
        <p className="text-sm text-muted-foreground">Deals by stage</p>
      </div>
      <div className="h-[300px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No pipeline data available
          </div>
        )}
      </div>
    </div>
  );
}