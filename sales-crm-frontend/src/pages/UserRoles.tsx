import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Eye, Pencil, Trash2, UserCheck } from "lucide-react";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface UserRole {
  id: string;
  roleName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const dummyRoles: UserRole[] = [
  { id: "1", roleName: "Admin", description: "Full system access with all permissions", isActive: true, createdAt: "2024-01-15" },
  { id: "2", roleName: "Sales", description: "Access to leads, opportunities, and proposals", isActive: true, createdAt: "2024-01-15" },
  { id: "3", roleName: "Customer", description: "Limited access to own leads and proposals", isActive: true, createdAt: "2024-01-15" },
  { id: "4", roleName: "Manager", description: "Team management and reporting access", isActive: false, createdAt: "2024-02-01" },
];

export default function UserRoles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<UserRole[]>(dummyRoles);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setIsCreateOpen(false);
  };

  const handleEdit = () => {
    setIsEditOpen(false);
    setSelectedRole(null);
  };

  const handleDelete = () => {
    if (selectedRole) {
      setRoles(roles.filter(r => r.id !== selectedRole.id));
    }
    setIsDeleteOpen(false);
    setSelectedRole(null);
  };

  const FormFields = ({ data, onChange, readOnly = false }: { data: Partial<UserRole>; onChange: (data: Partial<UserRole>) => void; readOnly?: boolean }) => (
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
        <Switch
          checked={data.isActive ?? true}
          onCheckedChange={(checked) => onChange({ ...data, isActive: checked })}
          disabled={readOnly}
        />
      </div>
    </div>
  );

  return (
    <AppLayout userRole="admin" userName="Admin User">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">User Roles</h1>
            <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
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

        <div className="card-elevated rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{role.roleName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{role.description}</TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{role.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedRole(role); setIsViewOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedRole(role); setIsEditOpen(true); }}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { setSelectedRole(role); setIsDeleteOpen(true); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CrudDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add New Role"
        onSave={handleCreate}
      >
        <FormFields data={{}} onChange={() => {}} />
      </CrudDialog>

      <CrudDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        title="View Role"
        mode="view"
      >
        {selectedRole && <FormFields data={selectedRole} onChange={() => {}} readOnly />}
      </CrudDialog>

      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Role"
        onSave={handleEdit}
      >
        {selectedRole && <FormFields data={selectedRole} onChange={() => {}} />}
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.roleName}"? This action cannot be undone.`}
      />
    </AppLayout>
  );
}
