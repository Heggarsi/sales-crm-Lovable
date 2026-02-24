import { useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  userRole: "admin" | "sales" | "customer";
  userName: string;
}

const pathToBreadcrumb: Record<string, string[]> = {
  "/dashboard": ["Dashboard"],
  "/users": ["Dashboard", "Users"],
  "/lead-sources": ["Dashboard", "Lead Sources"],
  "/lead-types": ["Dashboard", "Lead Types"],
  "/leads": ["Dashboard", "Leads"],
  "/lead-assignment": ["Dashboard", "Lead Assignment"],
  "/lead-qualification": ["Dashboard", "Lead Qualification"],
  "/opportunities": ["Dashboard", "Opportunities"],
  "/lost-opportunities": ["Dashboard", "Lost Opportunities"],
  "/appointments": ["Dashboard", "Appointments"],
  "/proposals": ["Dashboard", "Proposals"],
  "/mom": ["Dashboard", "MOM"],
  "/sales-orders": ["Dashboard", "Sales Orders"],
  "/lost-orders": ["Dashboard", "Lost Orders"],
  "/activity-log": ["Dashboard", "Activity Log"],
  "/audit-log": ["Dashboard", "Audit Log"],
  "/profile": ["Profile"],
  "/create-lead": ["Dashboard", "Create Lead"],
};

export function AppLayout({ children, userRole, userName }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumbs = pathToBreadcrumb[location.pathname] || ["Dashboard"];

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        role={userRole}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header
          breadcrumbs={breadcrumbs}
          userName={userName}
          userRole={userRole}
          onLogout={handleLogout}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
