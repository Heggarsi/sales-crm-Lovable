import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, Calendar } from "lucide-react";

export const LeadNavigation = () => {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: "Leads", path: "/leads", icon: Users },
    { name: "Appointments", path: "/lead-appointments", icon: Calendar },
  ];

  return (
    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = path === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              isActive
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
};
