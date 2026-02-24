import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Performer {
  id: string;
  name: string;
  deals: number;
  revenue: string;
  target: number;
  achieved: number;
}

const performers: Performer[] = [
  { id: "1", name: "Alex Thompson", deals: 24, revenue: "$182,500", target: 100, achieved: 92 },
  { id: "2", name: "Maria Garcia", deals: 21, revenue: "$156,000", target: 100, achieved: 78 },
  { id: "3", name: "David Kim", deals: 18, revenue: "$142,800", target: 100, achieved: 71 },
  { id: "4", name: "Sophie Turner", deals: 15, revenue: "$118,500", target: 100, achieved: 59 },
];

export function TopPerformers() {
  return (
    <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Top Performers</h3>
        <p className="text-sm text-muted-foreground">Sales team leaderboard</p>
      </div>
      <div className="space-y-5">
        {performers.map((person, index) => (
          <div key={person.id} className="flex items-center gap-4">
            <span className="text-lg font-bold text-muted-foreground w-6">
              #{index + 1}
            </span>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-medium text-sm">
                {person.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium truncate">{person.name}</p>
                <p className="text-sm font-semibold">{person.revenue}</p>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={person.achieved} className="h-2 flex-1" />
                <span className="text-sm text-muted-foreground">{person.achieved}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{person.deals} deals closed</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
