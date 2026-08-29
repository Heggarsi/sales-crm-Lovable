import { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, Layers, ChevronLeft, ChevronRight, LogOut, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ROLES } from "@/lib/auth";

interface SettingsSidebarProps {
  role?: number;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function SettingsSidebar({ role, onLogout, collapsed, onToggleCollapse }: SettingsSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement | null>(null);
  const canViewModuleSettings = role === ROLES.ADMIN || role === ROLES.SALES_MANAGER;

  const menuItems = [
    {
      label: "General Settings",
      path: "/settings?tab=general",
      icon: Settings,
      isActive: (pathname: string, search: string) => 
        (pathname === "/settings" && (!search || search.includes("tab=general"))) || 
        pathname === "/audit-log" || 
        pathname === "/activity-log"
    },
    ...(canViewModuleSettings ? [{
      label: "Module Settings",
      path: "/settings?tab=module",
      icon: Layers,
      isActive: (pathname: string, search: string) => 
        (pathname === "/settings" && search.includes("tab=module")) || 
        [
          "/user-roles", "/lead-sources", "/source-types", "/lead-types", 
          "/lead-statuses", "/lead-services-required", "/lead-followup-types",
          "/deal-stages", "/activity-types", 
          "/appointment-statuses", "/proposal-statuses", "/payment-statuses", 
          "/delivery-statuses"
        ].includes(pathname)
    }] : [])
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span
            className="font-display font-bold text-lg text-sidebar-foreground cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            Sales CRM
          </span>
        )}
        {collapsed && (
          <span
            className="font-display font-bold text-lg text-sidebar-foreground mx-auto cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            SC
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1"
      >
        <div className="px-3 mb-2 mt-2">
          {!collapsed && <h3 className="text-xs font-bold uppercase tracking-widest text-sidebar-foreground/50">Settings</h3>}
        </div>
        
        {menuItems.map((item) => {
          const active = item.isActive(location.pathname, location.search);
          const Icon = item.icon;

          const linkContent = (
            <Link
              to={item.path}
              className={cn(
                "sidebar-item",
                active && "active"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.label} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.label}>{linkContent}</div>;
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {collapsed ? (
          <>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={() => navigate("/dashboard")} className="sidebar-item w-full justify-center">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Back to Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={onLogout} className="sidebar-item w-full justify-center text-destructive">
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/dashboard")} className="sidebar-item w-full">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <button onClick={onLogout} className="sidebar-item w-full text-destructive">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
