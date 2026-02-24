import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Eye, Pencil, Trash2, Users as UsersIcon, Loader2 } from "lucide-react";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  isActive: boolean;
  isDeleted: boolean;
  roleId: string | null;
  roleName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

// Create a type for form data that matches what we need
interface UserFormData {
  id?: string;
  name: string;
  email: string;
  password?: string;
  isActive: boolean;
  roleId: string | null;
  roleName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserRole {
  id: string;
  roleName: string;
}

// Move FormFields outside the main component
const FormFields = ({ 
  data, 
  onChange, 
  roles, 
  readOnly = false, 
  isCreate = false 
}: { 
  data: UserFormData; 
  onChange: (data: UserFormData) => void; 
  roles: UserRole[];
  readOnly?: boolean;
  isCreate?: boolean;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={data.name || ""}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Enter full name"
          disabled={readOnly}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={data.email || ""}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="Enter email address"
          disabled={readOnly}
          autoComplete="off"
        />
      </div>
    </div>

    {isCreate && (
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={data.password || ""}
          onChange={(e) => onChange({ ...data, password: e.target.value })}
          placeholder="Enter password"
          disabled={readOnly}
          autoComplete="new-password"
        />
      </div>
    )}

    <div className="space-y-2">
      <Label htmlFor="role">Role</Label>
      <Select
        value={data.roleId || ""}
        onValueChange={(value) => {
          console.log('Selected roleId:', value);
          onChange({ ...data, roleId: value });
        }}
        disabled={readOnly}
      >
        <SelectTrigger id="role">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.roleName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="flex items-center justify-between">
      <Label htmlFor="active-status">Active Status</Label>
      <Switch
        id="active-status"
        checked={data.isActive ?? true}
        onCheckedChange={(checked) => onChange({ ...data, isActive: checked })}
        disabled={readOnly}
      />
    </div>

    {readOnly && (
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Created At</Label>
          <p className="text-sm">{data.createdAt ? new Date(data.createdAt).toLocaleString() : "N/A"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Updated At</Label>
          <p className="text-sm">{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "N/A"}</p>
        </div>
      </div>
    )}
  </div>
);

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",    
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function to map backend user to frontend User interface
const mapBackendUserToFrontend = (backendUser: any): User => {
  return {
    id: String(backendUser.UserId || backendUser.id),
    name: backendUser.Name || backendUser.name,
    email: backendUser.Email || backendUser.email,
    roleId: backendUser.RoleId ? String(backendUser.RoleId) : (backendUser.roleId || null),
    roleName: backendUser.RoleName || backendUser.roleName || "",
    isActive: Boolean(backendUser.IsActive ?? backendUser.isActive ?? true),
    isDeleted: Boolean(backendUser.IsDeleted ?? backendUser.isDeleted ?? false),
    createdAt: backendUser.CreatedAt || backendUser.createdAt || "",
    updatedAt: backendUser.UpdatedAt || backendUser.updatedAt || "",
    createdBy: backendUser.CreatedBy || backendUser.createdBy || null,
    updatedBy: backendUser.UpdatedBy || backendUser.updatedBy || null,
  };
};

// Helper function to map user to form data
const mapUserToFormData = (user: User): UserFormData => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    roleId: user.roleId,
    roleName: user.roleName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Helper function to map form data to backend format
const mapToBackendUser = (formData: UserFormData, includePassword = false) => {
  const backendData: any = {
    Name: formData.name,
    Email: formData.email,
    RoleId: formData.roleId ? parseInt(formData.roleId) : null,
    IsActive: formData.isActive ?? true
  };

  if (includePassword && formData.password) {
    backendData.Password = formData.password;
  }

  // Remove any undefined values
  Object.keys(backendData).forEach(key => 
    backendData[key] === undefined && delete backendData[key]
  );

  return backendData;
};

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    isActive: true,
    roleId: null,
  });
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users`, {
        headers: getAuthHeaders(),
      });
  
      if (!res.ok) throw new Error("Failed to fetch users");
  
      const result = await res.json();
  
      const mappedUsers: User[] = Array.isArray(result.data)
        ? result.data.map((u: any) => mapBackendUserToFrontend(u))
        : [];
  
      setUsers(mappedUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/roles`, {
        headers: getAuthHeaders(),
      });
  
      if (!res.ok) throw new Error("Failed to fetch roles");
  
      const result = await res.json();
      setRoles(
        Array.isArray(result.data)
          ? result.data.map((r: any) => ({
              id: String(r.RoleId),
              roleName: r.RoleName,
            }))
          : []
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setRoles([]);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const filteredUsers = Array.isArray(users)
    ? users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!formData.roleId) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a role", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const backendData = mapToBackendUser(formData, true);
      console.log('Sending to backend:', backendData);

      const res = await fetch(`${BACKEND_BASE_URL}/api/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(backendData),
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error('Backend error:', err);
        throw new Error(err.message || "Failed to create user");
      }
      
      toast({ title: "Success", description: "User created successfully." });
      fetchUsers();
      setIsCreateOpen(false);
      setFormData({
        name: "",
        email: "",
        isActive: true,
        roleId: null,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const backendData = mapToBackendUser(formData, false);
      console.log('Sending to backend:', backendData);

      const res = await fetch(`${BACKEND_BASE_URL}/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(backendData),
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error('Backend error:', err);
        throw new Error(err.message || "Failed to update user");
      }
      
      toast({ title: "Success", description: "User updated successfully." });
      fetchUsers();
      setIsEditOpen(false);
      setSelectedUser(null);
      setFormData({
        name: "",
        email: "",
        isActive: true,
        roleId: null,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete user");
      }
      
      toast({ title: "Success", description: "User deleted successfully." });
      fetchUsers();
      setIsDeleteOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openCreate = () => {
    setFormData({ 
      name: "", 
      email: "", 
      password: "", 
      isActive: true,
      roleId: null
    });
    setIsCreateOpen(true);
  };

  const openView = async (user: User) => {
    console.log('Opening view for user:', user); // Debug log
    
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/${user.id}`, { 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) throw new Error("Failed to fetch user details");
      
      const data = await res.json();
      console.log('Raw API response for view:', data); // Debug log
      
      // Map the backend response to your User interface
      const mappedUser: User = {
        id: String(data.UserId || data.id || user.id),
        name: data.Name || data.name || user.name,
        email: data.Email || data.email || user.email,
        roleId: data.RoleId ? String(data.RoleId) : (data.roleId || user.roleId),
        roleName: data.RoleName || data.roleName || user.roleName,
        isActive: Boolean(data.IsActive ?? data.isActive ?? user.isActive),
        isDeleted: Boolean(data.IsDeleted ?? data.isDeleted ?? false),
        createdAt: data.CreatedAt || data.createdAt || user.createdAt || new Date().toISOString(),
        updatedAt: data.UpdatedAt || data.updatedAt || user.updatedAt || "",
        createdBy: data.CreatedBy || data.createdBy || null,
        updatedBy: data.UpdatedBy || data.updatedBy || null,
      };
      
      console.log('Mapped user for view:', mappedUser); // Debug log
      
      setSelectedUser(mappedUser);
      
      // Set form data with ALL fields for view mode
      setFormData({
        id: mappedUser.id,
        name: mappedUser.name,
        email: mappedUser.email,
        roleId: mappedUser.roleId,
        roleName: mappedUser.roleName,
        isActive: mappedUser.isActive,
        createdAt: mappedUser.createdAt,
        updatedAt: mappedUser.updatedAt,
      });
      
      console.log('Form data set for view:', {
        id: mappedUser.id,
        name: mappedUser.name,
        email: mappedUser.email,
        roleId: mappedUser.roleId,
        roleName: mappedUser.roleName,
        isActive: mappedUser.isActive,
        createdAt: mappedUser.createdAt,
        updatedAt: mappedUser.updatedAt
      });
      
    } catch (error) {
      console.error('Error fetching user details for view:', error);
      // Fallback to basic user data if fetch fails
      setSelectedUser(user);
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        roleName: user.roleName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    }
    
    // Open the dialog
    setIsViewOpen(true);
  };

  const openEdit = async (user: User) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/${user.id}`, { 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) throw new Error("Failed to fetch user details");
      
      const data = await res.json();
      console.log('Raw API response:', data); // Debug log
      
      // Map the backend response to your User interface
      const mappedUser: User = {
        id: String(data.UserId || data.id || user.id),
        name: data.Name || data.name || user.name,
        email: data.Email || data.email || user.email,
        roleId: data.RoleId ? String(data.RoleId) : (data.roleId || user.roleId),
        roleName: data.RoleName || data.roleName || user.roleName,
        isActive: Boolean(data.IsActive ?? data.isActive ?? user.isActive),
        isDeleted: Boolean(data.IsDeleted ?? data.isDeleted ?? false),
        createdAt: data.CreatedAt || data.createdAt || user.createdAt,
        updatedAt: data.UpdatedAt || data.updatedAt || user.updatedAt,
        createdBy: data.CreatedBy || data.createdBy || null,
        updatedBy: data.UpdatedBy || data.updatedBy || null,
      };
      
      setSelectedUser(mappedUser);
      
      // Set form data with ALL fields including id, name, email, roleId, isActive
      setFormData({
        id: mappedUser.id,
        name: mappedUser.name,
        email: mappedUser.email,
        roleId: mappedUser.roleId,
        isActive: mappedUser.isActive,
        // Include these for view mode if needed
        roleName: mappedUser.roleName,
        createdAt: mappedUser.createdAt,
        updatedAt: mappedUser.updatedAt,
      });
      
      console.log('Form data set:', {
        id: mappedUser.id,
        name: mappedUser.name,
        email: mappedUser.email,
        roleId: mappedUser.roleId,
        isActive: mappedUser.isActive
      });
      
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback to basic user data if fetch fails
      setSelectedUser(user);
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        isActive: user.isActive,
        roleName: user.roleName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    }
    setIsEditOpen(true);
  };

  const openDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  return (
    <AppLayout userRole="admin" userName="Admin User">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <UsersIcon className="w-8 h-8 text-primary" />
              Users Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions</p>
          </div>
          <Button onClick={openCreate} className="gap-2 gradient-primary">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UsersIcon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.roleName === "Admin" ? "default" : "secondary"}>
                          {user.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.isActive ? "default" : "outline"}
                          className={user.isActive ? "bg-success text-success-foreground" : ""}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(user)}>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(user)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDelete(user)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <CrudDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add New User"
        description="Create a new user account"
        onSave={handleCreate}
        saveLabel="Create User"
      >
        <FormFields 
          data={formData} 
          onChange={setFormData} 
          roles={roles}
          isCreate 
        />
      </CrudDialog>

      <CrudDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        title="View User"
        description="User account details"
        mode="view"
      >
        <FormFields 
          data={formData} 
          onChange={() => {}} 
          roles={roles}
          readOnly 
        />
      </CrudDialog>

      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit User"
        description="Update user account details"
        onSave={handleEdit}
        saveLabel="Update User"
        mode="edit"
      >
        <FormFields 
          data={formData} 
          onChange={setFormData} 
          roles={roles}
        />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
      />
    </AppLayout>
  );
}