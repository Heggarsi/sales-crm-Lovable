import { useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { clearAuthStorage, getAuthUser, getRoleName } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
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
  "/settings": ["Dashboard", "Settings"],
};

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = getAuthUser();
  const userName = authUser?.Name || "User";
  const userRole = getRoleName(authUser?.RoleId);

  const settingsRoutes = [
    "/settings",
    "/activity-log",
    "/audit-log",
    "/user-roles",
    "/lead-sources",
    "/source-types",
    "/lead-types",
    "/lead-statuses",
    "/deal-stages",
    "/activity-types",
    "/appointment-statuses",
    "/proposal-statuses",
    "/payment-statuses",
    "/delivery-statuses",
  ];

  const isSettingsPage = settingsRoutes.includes(location.pathname);
  const breadcrumbs = pathToBreadcrumb[location.pathname] || ["Dashboard"];

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login");
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {!isSettingsPage && (
        <Sidebar
          role={authUser?.RoleId}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      <div
        className={cn(
          "flex-1 min-w-0 overflow-hidden flex flex-col transition-all duration-300",
          !isSettingsPage ? (sidebarCollapsed ? "ml-16" : "ml-16 lg:ml-64") : "ml-0"
        )}
      >
        <Header
          breadcrumbs={breadcrumbs}
          userName={userName}
          userRole={userRole}
          onLogout={handleLogout}
          showBackButton={isSettingsPage}
        />
        <main className={cn("flex-1 min-w-0 overflow-y-auto scrollbar-hide p-4 md:p-6", isSettingsPage && "max-w-7xl mx-auto w-full")}>
          {children}
        </main>
      </div>
    </div>
  );
}
