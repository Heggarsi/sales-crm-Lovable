import { useState, useEffect, useCallback } from "react";
import { Activity, Plus, Search, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface ActivityType {
  ActivityTypeId: number;
  TypeName: string;
  Description?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function ActivityTypes() {
  const [data, setData] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ActivityType | null>(null);
  const [formData, setFormData] = useState({ typeName: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/activity-types`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch activity types");
      const result = await res.json();
      setData(Array.isArray(result.data) ? result.data : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(item =>
    item.TypeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.typeName) {
      toast({ title: "Validation Error", description: "Type name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/activity-types`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create activity type");
      toast({ title: "Success", description: "Activity type created successfully" });
      fetchData();
      setIsCreateOpen(false);
      setFormData({ typeName: "", description: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !formData.typeName) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/activity-types/${selectedItem.ActivityTypeId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update activity type");
      toast({ title: "Success", description: "Activity type updated successfully" });
      fetchData();
      setIsEditOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/activity-types/${selectedItem.ActivityTypeId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete activity type");
      toast({ title: "Success", description: "Activity type deleted successfully" });
      fetchData();
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEdit = (item: ActivityType) => {
    setSelectedItem(item);
    setFormData({ typeName: item.TypeName, description: item.Description || "" });
    setIsEditOpen(true);
  };

  const openDelete = (item: ActivityType) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Activity className="w-7 h-7 text-primary" />
              Activity Types
            </h1>
            <p className="text-muted-foreground">Manage activity type options</p>
          </div>
          <Button className="gradient-primary" onClick={() => { setFormData({ typeName: "", description: "" }); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search types..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading activity types...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No activity types found.</TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.ActivityTypeId}>
                      <TableCell>
                        <Badge variant="secondary">{item.TypeName}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.Description || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => openDelete(item)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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
        title="Add Activity Type"
        saveLabel="Create"
        onSave={handleCreate}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Type Name *</Label>
            <Input value={formData.typeName} onChange={(e) => setFormData({ ...formData, typeName: e.target.value })} placeholder="Enter activity type name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter description" />
          </div>
        </div>
      </CrudDialog>

      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Activity Type"
        saveLabel="Save Changes"
        mode="edit"
        onSave={handleUpdate}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Type Name *</Label>
            <Input value={formData.typeName} onChange={(e) => setFormData({ ...formData, typeName: e.target.value })} placeholder="Enter activity type name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter description" />
          </div>
        </div>
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        title="Delete Activity Type"
        description={`Are you sure you want to delete "${selectedItem?.TypeName}"? This action cannot be undone.`}
      />
    </SettingsLayout>
  );
}
