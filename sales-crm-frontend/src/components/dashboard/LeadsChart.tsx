import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", leads: 45, qualified: 32, converted: 18 },
  { name: "Feb", leads: 52, qualified: 38, converted: 22 },
  { name: "Mar", leads: 61, qualified: 45, converted: 28 },
  { name: "Apr", leads: 58, qualified: 42, converted: 25 },
  { name: "May", leads: 72, qualified: 55, converted: 35 },
  { name: "Jun", leads: 85, qualified: 62, converted: 42 },
  { name: "Jul", leads: 78, qualified: 58, converted: 38 },
];

export function LeadsChart() {
  return (
    <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Lead Performance</h3>
        <p className="text-sm text-muted-foreground">Monthly lead tracking</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-md)",
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLeads)"
              name="Total Leads"
            />
            <Area
              type="monotone"
              dataKey="qualified"
              stroke="hsl(var(--info))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorQualified)"
              name="Qualified"
            />
            <Area
              type="monotone"
              dataKey="converted"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConverted)"
              name="Converted"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Total Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-info" />
          <span className="text-sm text-muted-foreground">Qualified</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Converted</span>
        </div>
      </div>
    </div>
  );
}
