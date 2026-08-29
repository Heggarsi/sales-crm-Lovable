import { ChevronRight, Search, User, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAuthUser } from "@/lib/auth";

interface HeaderProps {
  breadcrumbs: string[];
  userName: string;
  userRole: string;
  onLogout: () => void;
  showBackButton?: boolean;
}

export function Header({ breadcrumbs, userName, userRole, onLogout, showBackButton }: HeaderProps) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const authUser = getAuthUser();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left Section: Breadcrumb or Back Button */}
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 font-medium"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </Button>
        )}
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 breadcrumb-separator" />}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? "text-foreground font-medium"
                  : "breadcrumb-item cursor-pointer"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads, contacts..."
            className="w-64 pl-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{userName}</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 capitalize">
                  {userRole}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>Logged-in user details from local storage.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <ProfileRow label="User ID" value={authUser?.UserId} />
          <ProfileRow label="Name" value={authUser?.Name} />
          <ProfileRow label="Email" value={authUser?.Email} />
          <ProfileRow label="Role" value={userRole} />
          <ProfileRow label="Role ID" value={authUser?.RoleId} />
          <ProfileRow label="Created At" value={authUser?.CreatedAt} />
          <ProfileRow label="Created By" value={authUser?.CreatedBy ?? "N/A"} />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 rounded-md border border-border px-3 py-2">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="break-words text-foreground">{value || "N/A"}</span>
    </div>
  );
}
