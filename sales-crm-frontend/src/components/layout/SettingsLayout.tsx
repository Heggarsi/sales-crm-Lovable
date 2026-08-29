import { useState, ReactNode } from "react";
import { SettingsSidebar } from "./SettingsSidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthStorage, getAuthUser, getRoleName } from "@/lib/auth";

interface SettingsLayoutProps {
  children: ReactNode;
}

const pathToBreadcrumb: Record<string, string[]> = {
  "/settings": ["Dashboard", "Settings"],
  "/activity-log": ["Dashboard", "Settings", "Activity Log"],
  "/audit-log": ["Dashboard", "Settings", "Audit Log"],
  "/user-roles": ["Dashboard", "Settings", "User Roles"],
  "/lead-sources": ["Dashboard", "Settings", "Lead Sources"],
  "/source-types": ["Dashboard", "Settings", "Source Types"],
  "/lead-types": ["Dashboard", "Settings", "Lead Types"],
  "/lead-statuses": ["Dashboard", "Settings", "Lead Statuses"],
  "/deal-stages": ["Dashboard", "Settings", "Deal Stages"],
  "/activity-types": ["Dashboard", "Settings", "Activity Types"],
  "/appointment-statuses": ["Dashboard", "Settings", "Appointment Statuses"],
  "/proposal-statuses": ["Dashboard", "Settings", "Proposal Statuses"],
  "/payment-statuses": ["Dashboard", "Settings", "Payment Statuses"],
  "/delivery-statuses": ["Dashboard", "Settings", "Delivery Statuses"],
};

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const userName = authUser?.Name || "User";
  const userRole = getRoleName(authUser?.RoleId);

  const breadcrumbs = pathToBreadcrumb[location.pathname] || ["Dashboard", "Settings"];

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SettingsSidebar 
        role={authUser?.RoleId}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header
          breadcrumbs={breadcrumbs}
          userName={userName}
          userRole={userRole}
          onLogout={handleLogout}
        />
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
