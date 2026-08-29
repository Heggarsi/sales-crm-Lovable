import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  Calendar,
  Package,
  XCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Building2,
  UserSquare2,
  BadgeDollarSign,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ROLES } from "@/lib/auth";

interface SidebarProps {
  role?: number;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  activePaths?: string[];
  children?: MenuItem[];
}

const leadsSubmenu: MenuItem[] = [
  { label: "Leads", icon: Target, path: "/leads" },
  { label: "Appointments", icon: Calendar, path: "/lead-appointments" },
];

const leadsSectionPaths = ["/leads", "/lead-appointments"];
const leadsLastPathKey = "sidebar-leads-last-path";

const contactsSubmenu: MenuItem[] = [
  { label: "Contacts", icon: UserSquare2, path: "/contacts" },
  { label: "Appointments", icon: Calendar, path: "/contact-appointments" },
];

const contactsSectionPaths = ["/contacts", "/contact-appointments"];
const contactsLastPathKey = "sidebar-contacts-last-path";

const dealsSubmenu: MenuItem[] = [
  { label: "Deals", icon: BadgeDollarSign, path: "/deals" },
  { label: "Appointments", icon: Calendar, path: "/appointments", activePaths: ["/proposal-appointments", "/mom"] },
  { label: "Proposals", icon: FileText, path: "/proposals" },
  { label: "Sales Orders", icon: Package, path: "/sales-orders" },
  { label: "Lost Orders", icon: XCircle, path: "/lost-orders" },
];

const dealsSectionPaths = [
  "/deals",
  "/appointments",
  "/proposal-appointments",
  "/mom",
  "/proposals",
  "/sales-orders",
  "/lost-orders",
];

const dealsLastPathKey = "sidebar-deals-last-path";
const sidebarScrollTopKey = "sidebar-scroll-top";

const adminMenu: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "Leads", icon: Target, path: "/leads", children: leadsSubmenu },
  { label: "Accounts", icon: Building2, path: "/accounts" },
  { label: "Contacts", icon: UserSquare2, path: "/contacts", children: contactsSubmenu },
  { label: "Deals", icon: BadgeDollarSign, path: "/deals", children: dealsSubmenu },
];

const salesmanagerMenu: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Leads", icon: Target, path: "/leads", children: leadsSubmenu },
  { label: "Accounts", icon: Building2, path: "/accounts" },
  { label: "Contacts", icon: UserSquare2, path: "/contacts", children: contactsSubmenu },
  { label: "Deals", icon: BadgeDollarSign, path: "/deals", children: dealsSubmenu },
];

const salespersonMenu: MenuItem[] = [
  { label: "Leads", icon: Target, path: "/leads", children: leadsSubmenu },
  { label: "Accounts", icon: Building2, path: "/accounts" },
  { label: "Contacts", icon: UserSquare2, path: "/contacts", children: contactsSubmenu },
  { label: "Deals", icon: BadgeDollarSign, path: "/deals", children: dealsSubmenu },
];

export function Sidebar({ role, onLogout, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);

  // Effective collapsed state: icon-only below lg breakpoint (1024px) regardless of toggle,
  // so the sidebar stays visible on mobile/tablet without overflowing.
  const [isLg, setIsLg] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsLg(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  const effectiveCollapsed = collapsed || !isLg;

  const menuItems = useMemo(
    () =>
      role === ROLES.ADMIN
        ? adminMenu
        : role === ROLES.SALES_MANAGER
          ? salesmanagerMenu
          : salespersonMenu,
    [role]
  );
  const isPathActive = useCallback(
    (menuItem: MenuItem) =>
      location.pathname === menuItem.path || !!menuItem.activePaths?.includes(location.pathname),
    [location.pathname]
  );
  const hasActiveChild = useCallback(
    (menuItem: MenuItem) => !!menuItem.children?.some(isPathActive),
    [isPathActive]
  );

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(menuItems.filter(hasActiveChild).map((item) => [item.path, true]))
  );
  const [dealsLastPath, setDealsLastPath] = useState(() =>
    sessionStorage.getItem(dealsLastPathKey) || ""
  );
  const [leadsLastPath, setLeadsLastPath] = useState(() =>
    sessionStorage.getItem(leadsLastPathKey) || ""
  );
  const [contactsLastPath, setContactsLastPath] = useState(() =>
    sessionStorage.getItem(contactsLastPathKey) || ""
  );

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(sidebarScrollTopKey);

    if (navRef.current && savedScroll) {
      navRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  useEffect(() => {
    if (navRef.current) {
      navRef.current.scrollTop = Number(
        sessionStorage.getItem(sidebarScrollTopKey) || navRef.current.scrollTop
      );
    }
  }, [location.pathname]);

  useEffect(() => {
    const activeParents = menuItems.filter(hasActiveChild);
    if (activeParents.length) {
      setExpandedMenus((current) => ({
        ...current,
        ...Object.fromEntries(activeParents.map((item) => [item.path, true])),
      }));
    }
  }, [location.pathname, menuItems, hasActiveChild]);

  useEffect(() => {
    if (dealsSectionPaths.includes(location.pathname)) {
      setDealsLastPath(location.pathname);
      sessionStorage.setItem(dealsLastPathKey, location.pathname);
    }
    if (leadsSectionPaths.includes(location.pathname)) {
      setLeadsLastPath(location.pathname);
      sessionStorage.setItem(leadsLastPathKey, location.pathname);
    }
    if (contactsSectionPaths.includes(location.pathname)) {
      setContactsLastPath(location.pathname);
      sessionStorage.setItem(contactsLastPathKey, location.pathname);
    }
  }, [location.pathname]);

  return (
    <aside
      className={cn(
        "flex fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col",
        collapsed ? "w-16" : "w-16 lg:w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        {!effectiveCollapsed && (
          <span className="font-display font-bold text-lg text-sidebar-foreground">
            Sales CRM
          </span>
        )}
        {effectiveCollapsed && (
          <span className="font-display font-bold text-lg text-sidebar-foreground mx-auto">
            SC
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1"
        onScroll={(e) => {
          sessionStorage.setItem(sidebarScrollTopKey, String(e.currentTarget.scrollTop));
        }}
      >
        {menuItems.map((item) => {
          const hasChildren = !!item.children?.length;
          const isChildActive = hasChildren && hasActiveChild(item);
          const isActive = isPathActive(item) || isChildActive;
          const isExpanded = !!expandedMenus[item.path];
          const targetPath = hasChildren 
            ? item.path === "/deals" ? (dealsLastPath || item.path)
            : item.path === "/leads" ? (leadsLastPath || item.path)
            : item.path === "/contacts" ? (contactsLastPath || item.path)
            : item.path
            : item.path;
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              to={targetPath}
              onClick={(event) => {
                if (hasChildren) {
                  if (isExpanded) {
                    event.preventDefault();
                  }

                  setExpandedMenus((current) => ({
                    ...current,
                    [item.path]: !current[item.path],
                  }));
                }
              }}
              className={cn(
                "sidebar-item",
                isActive && "active"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!effectiveCollapsed && <span>{item.label}</span>}
            </NavLink>
          );

          if (effectiveCollapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <div key={item.path}>
              {linkContent}
              {hasChildren && isExpanded && (
                <div className="mt-1 ml-2 border-l border-sidebar-border pl-2 space-y-1">
                  {item.children!.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildCurrent = isPathActive(child);

                    return (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isChildCurrent && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <ChildIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {effectiveCollapsed ? (
          <>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to="/settings"
                  className={cn(
                    "sidebar-item w-full justify-center",
                    location.pathname === "/settings" && "active"
                  )}
                >
                  <Settings className="w-5 h-5" />
                </NavLink>
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
            <NavLink
              to="/settings"
              className={cn(
                "sidebar-item w-full",
                location.pathname === "/settings" && "active"
              )}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </NavLink>
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
