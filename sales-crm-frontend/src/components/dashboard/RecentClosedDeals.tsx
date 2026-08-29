import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ClosedDeal {
  DealId: number;
  name: string;
  amount: number | string;
  status: string;
  owner: string;
  date: string;
}

interface RecentClosedDealsProps {
  data?: ClosedDeal[];
}

const statusStyles: Record<string, string> = {
  "Closed Won": "status-converted",
  "Closed Lost": "status-lost",
};

export function RecentClosedDeals({ data = [] }: RecentClosedDealsProps) {
  const formatCurrency = (val: number | string) => {
    const amount = Number(val);

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <div className="card-elevated animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recent Closed Deals</h3>
            <p className="text-sm text-muted-foreground">Latest won and lost opportunities</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {data.length > 0 ? (
          data.map((deal) => (
            <div
              key={deal.DealId}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {deal.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{deal.name}</p>
                  <p className="text-sm text-muted-foreground">{deal.owner}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn("status-badge", statusStyles[deal.status] || "bg-muted")}>
                  {deal.status}
                </span>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(deal.amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(deal.date)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-muted-foreground">
            No recently closed deals
          </div>
        )}
      </div>
    </div>
  );
}
