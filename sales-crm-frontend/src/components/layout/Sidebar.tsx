import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  Calendar,
  TrendingUp,
  Package,
  XCircle,
  Activity,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  ListFilter,
  UserCheck,
  FileCheck,
  ClipboardList,
  MessageSquare,
  Briefcase,
  Link2,
  Tag,
  CheckSquare,
  Truck,
  CreditCard,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  role: "admin" | "sales" | "customer";
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const adminMenu: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "User Roles", icon: UserCheck, path: "/user-roles" },
  { label: "Lead Sources", icon: ListFilter, path: "/lead-sources" },
  { label: "Source Types", icon: Tag, path: "/source-types" },
  { label: "Lead Types", icon: Tag, path: "/lead-types" },
  { label: "Lead Statuses", icon: CheckSquare, path: "/lead-statuses" },
  { label: "Leads", icon: Target, path: "/leads" },
  { label: "Lead Business Info", icon: Briefcase, path: "/lead-business-info" },
  { label: "Lead Qualification", icon: FileCheck, path: "/lead-qualification" },
  { label: "Opportunities", icon: TrendingUp, path: "/opportunities" },
  { label: "Lost Opportunities", icon: XCircle, path: "/lost-opportunities" },
  { label: "Appointments", icon: Calendar, path: "/appointments" },
  { label: "Proposals", icon: FileText, path: "/proposals" },
  { label: "Proposal Appointment", icon: Link2, path: "/proposal-appointments" },
  { label: "MOM", icon: MessageSquare, path: "/mom" },
  { label: "Sales Orders", icon: Package, path: "/sales-orders" },
  { label: "Lost Orders", icon: XCircle, path: "/lost-orders" },
  { label: "Activity Log", icon: Activity, path: "/activity-log" },
  { label: "Audit Log", icon: Shield, path: "/audit-log" },
  { label: "Activity Types", icon: Activity, path: "/activity-types" },
  { label: "Appointment Statuses", icon: Calendar, path: "/appointment-statuses" },
  { label: "Opportunity Stages", icon: Award, path: "/opportunity-stages" },
  { label: "Opportunity Statuses", icon: TrendingUp, path: "/opportunity-statuses" },
  { label: "Proposal Statuses", icon: FileText, path: "/proposal-statuses" },
  { label: "Payment Statuses", icon: CreditCard, path: "/payment-statuses" },
  { label: "Delivery Statuses", icon: Truck, path: "/delivery-statuses" },
  { label: "Qualification Statuses", icon: FileCheck, path: "/qualification-statuses" },
];

const salesMenu: MenuItem[] = [
  { label: "My Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Leads", icon: Target, path: "/leads" },
  { label: "Lead Qualification", icon: FileCheck, path: "/lead-qualification" },
  { label: "Opportunities", icon: TrendingUp, path: "/opportunities" },
  { label: "Proposals", icon: FileText, path: "/proposals" },
  { label: "Appointments", icon: Calendar, path: "/appointments" },
  { label: "MOM", icon: MessageSquare, path: "/mom" },
  { label: "Sales Orders", icon: Package, path: "/sales-orders" },
  { label: "Lost Orders", icon: XCircle, path: "/lost-orders" },
  { label: "Activity Log", icon: Activity, path: "/activity-log" },
];

const customerMenu: MenuItem[] = [
  { label: "My Profile", icon: Users, path: "/profile" },
  { label: "Create Lead", icon: Target, path: "/create-lead" },
  { label: "My Leads", icon: ClipboardList, path: "/leads" },
  { label: "My Appointments", icon: Calendar, path: "/appointments" },
  { label: "My Proposals", icon: FileText, path: "/proposals" },
  { label: "MOM", icon: MessageSquare, path: "/mom" },
];

export function Sidebar({ role, onLogout, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  const menuItems = role === "admin" ? adminMenu : role === "sales" ? salesMenu : customerMenu;

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-sidebar-foreground">
              Sales CRM
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              to={item.path}
              className={cn(
                "sidebar-item",
                isActive && "active"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.path}>{linkContent}</div>;
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {collapsed ? (
          <>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button className="sidebar-item w-full justify-center">
                  <Settings className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
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
            <button className="sidebar-item w-full">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
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
