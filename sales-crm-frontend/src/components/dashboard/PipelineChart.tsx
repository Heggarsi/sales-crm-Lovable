import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "Identified", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Qualification", value: 32, color: "hsl(var(--chart-2))" },
  { name: "Proposal", value: 24, color: "hsl(var(--chart-3))" },
  { name: "Negotiation", value: 18, color: "hsl(var(--chart-4))" },
  { name: "Won", value: 12, color: "hsl(var(--success))" },
  { name: "Lost", value: 8, color: "hsl(var(--destructive))" },
];

export function PipelineChart() {
  return (
    <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Sales Pipeline</h3>
        <p className="text-sm text-muted-foreground">Opportunities by stage</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
