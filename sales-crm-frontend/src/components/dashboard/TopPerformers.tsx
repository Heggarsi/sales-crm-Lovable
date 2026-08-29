import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Performer {
  name: string;
  wonDeals: number;
  revenue: number | string;
  target?: number;
  achieved?: number;
}

interface TopPerformersProps {
  data?: Performer[];
}

export function TopPerformers({ data = [] }: TopPerformersProps) {
  // Format revenue as currency if it's a number
  const formatRevenue = (val: number | string) => {
    if (typeof val === 'string') return val;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Top Performers</h3>
        <p className="text-sm text-muted-foreground">Sales team leaderboard</p>
      </div>
      <div className="space-y-5">
        {data.length > 0 ? (
          data.map((person, index) => {
            // If achieved is not provided, we can either hide it or set a dummy one based on revenue
            // For now, let's just show wonDeals and revenue as requested
            const achieved = person.achieved || Math.min(100, Math.floor((person.wonDeals / 10) * 100)); // Dummy achievement if not provided
            
            return (
              <div key={index} className="flex items-center gap-4">
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
                    <p className="text-sm font-semibold">{formatRevenue(person.revenue)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={achieved} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground">{achieved}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{person.wonDeals} deals closed</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            No performers yet
          </div>
        )}
      </div>
    </div>
  );
}
