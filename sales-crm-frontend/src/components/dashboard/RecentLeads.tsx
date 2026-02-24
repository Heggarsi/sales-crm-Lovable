import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  value: string;
  date: string;
}

const leads: Lead[] = [
  { id: "1", name: "Sarah Johnson", company: "TechStart Inc", status: "qualified", value: "$25,000", date: "2 hours ago" },
  { id: "2", name: "Michael Chen", company: "GlobalTech", status: "new", value: "$45,000", date: "4 hours ago" },
  { id: "3", name: "Emily Davis", company: "Innovate Labs", status: "contacted", value: "$18,500", date: "6 hours ago" },
  { id: "4", name: "James Wilson", company: "DataFlow Systems", status: "qualified", value: "$32,000", date: "1 day ago" },
  { id: "5", name: "Lisa Anderson", company: "CloudNine", status: "new", value: "$52,000", date: "1 day ago" },
];

const statusStyles: Record<Lead["status"], string> = {
  new: "status-new",
  contacted: "status-contacted",
  qualified: "status-qualified",
  converted: "status-converted",
  lost: "status-lost",
};

export function RecentLeads() {
  return (
    <div className="card-elevated animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recent Leads</h3>
            <p className="text-sm text-muted-foreground">Latest incoming opportunities</p>
          </div>
          <button className="text-sm text-primary font-medium hover:underline">
            View all
          </button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {lead.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-sm text-muted-foreground">{lead.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn("status-badge", statusStyles[lead.status])}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </span>
              <div className="text-right">
                <p className="font-semibold">{lead.value}</p>
                <p className="text-xs text-muted-foreground">{lead.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
