export interface AuthUser {
  UserId: number;
  Name: string;
  Email: string;
  CreatedAt: string;
  CreatedBy: number | null;
  RoleId: number;
}

export const ROLES = {
  ADMIN: 1,
  SALES_MANAGER: 2,
  SALES_PERSON: 3,
} as const;

export const ROLE_NAMES: Record<number, string> = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.SALES_MANAGER]: "Sales Manager",
  [ROLES.SALES_PERSON]: "Sales Person",
};

export const getRoleName = (roleId?: number | null) =>
  roleId ? ROLE_NAMES[roleId] || "Sales Person" : "Sales Person";

export const getAuthUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem("authUser");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem("authUser");
    return null;
  }
};

export const toAuthUser = (user: Partial<AuthUser>): AuthUser => ({
  UserId: Number(user.UserId),
  Name: user.Name || "",
  Email: user.Email || "",
  CreatedAt: user.CreatedAt || "",
  CreatedBy: user.CreatedBy ?? null,
  RoleId: Number(user.RoleId),
});

export const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("authUser");
  // session storage
  sessionStorage.removeItem("sidebar-deals-last-path");
  sessionStorage.removeItem("sidebar-scroll-top");

  // OR clear everything from session storage
  // sessionStorage.clear();
};
