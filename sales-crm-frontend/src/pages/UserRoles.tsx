import { useState, useEffect, useCallback } from "react";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Eye, Pencil, Trash2, UserCheck, Loader2 } from "lucide-react";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface UserRole {
  id: string;
  roleName: string;
  description: string;
  isActive: boolean;
}

interface RoleFormData {
  roleName: string;
  description: string;
  isActive: boolean;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (r: any): UserRole => ({
  id: String(r.RoleId),
  roleName: r.RoleName || "",
  description: r.Description || "",
  isActive: Boolean(r.IsActive ?? true),
});

const mapFormToBackend = (form: RoleFormData) => ({
  RoleName: form.roleName,
  Description: form.description,
  IsActive: form.isActive,
});

const emptyForm: RoleFormData = { roleName: "", description: "", isActive: true };

// Form fields component
const FormFields = ({
  data,
  onChange,
  readOnly = false,
  isFetching = false
}: {
  data: RoleFormData;
  onChange: (data: RoleFormData) => void;
  readOnly?: boolean;
  isFetching?: boolean;
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching role details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Role Name *</Label>
        <Input
          value={data.roleName || ""}
          onChange={(e) => onChange({ ...data, roleName: e.target.value })}
          placeholder="Enter role name"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={data.description || ""}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Enter role description"
          disabled={readOnly}
          rows={3}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Active Status</Label>
        < Switch
          checked={data.isActive ?? true}
          onCheckedChange={(checked) => onChange({ ...data, isActive: checked })}
          disabled={readOnly}
        />
      </div>
    </div>
  );
};

export default function UserRoles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(emptyForm);
  const { toast } = useToast();

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/roles`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const result = await res.json();
      const mapped = Array.isArray(result.data)
        ? result.data.map(mapBackendToFrontend)
        : [];
      setRoles(mapped);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const fetchRoleDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/roles/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch role details");
      const result = await res.json();
      const r = result.data;
      const mappedFormData = {
        roleName: r.RoleName || "",
        description: r.Description || "",
        isActive: Boolean(r.IsActive ?? true),
      };
      setFormData(mappedFormData);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.roleName) {
      toast({ title: "Validation Error", description: "Role name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/roles`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(mapFormToBackend(formData)),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create role");
      }
      toast({ title: "Success", description: "Role created successfully." });
      fetchRoles();
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedRole || !formData.roleName) {
      toast({ title: "Validation Error", description: "Role name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(mapFormToBackend(formData)),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update role");
      }
      toast({ title: "Success", description: "Role updated successfully." });
      fetchRoles();
      setIsEditOpen(false);
      setSelectedRole(null);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/roles/${selectedRole.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete role");
      }
      toast({ title: "Success", description: "Role deleted successfully." });
      fetchRoles();
      setIsDeleteOpen(false);
      setSelectedRole(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setIsCreateOpen(true);
  };

  const openView = async (role: UserRole) => {
    setSelectedRole(role);
    setIsViewOpen(true);
    await fetchRoleDetail(role.id);
  };

  const openEdit = async (role: UserRole) => {
    setSelectedRole(role);
    setIsEditOpen(true);
    await fetchRoleDetail(role.id);
  };

  const openDelete = (role: UserRole) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">User Roles</h1>
            <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
          </div>
          <Button onClick={openCreate} className="gap-2 gradient-primary">
            <Plus className="w-4 h-4" />
            Add Role
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden border-none shadow-premium">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading roles...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="pl-6">Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px] text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No roles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-muted/30">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">{role.roleName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(role)}>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(role)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDelete(role)} className="text-destructive">
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

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Add New Role" onSave={handleCreate} saveLabel="Create Role">
        <FormFields data={formData} onChange={setFormData} />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Role" mode="view">
        <FormFields data={formData} onChange={() => {}} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Role" onSave={handleEdit} saveLabel="Update Role" mode="edit">
        <FormFields data={formData} onChange={setFormData} isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.roleName}"? This action cannot be undone.`}
      />
    </SettingsLayout>
  );
}
