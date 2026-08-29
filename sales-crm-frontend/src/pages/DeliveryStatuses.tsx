import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Search, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
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

interface DeliveryStatus {
  DeliveryStatusId: number;
  StatusName: string;
  Description?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function DeliveryStatuses() {
  const [data, setData] = useState<DeliveryStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DeliveryStatus | null>(null);
  const [formData, setFormData] = useState({ statusName: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/delivery-statuses`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch delivery statuses");
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
    item.StatusName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.statusName) {
      toast({ title: "Validation Error", description: "Status name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/delivery-statuses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create delivery status");
      toast({ title: "Success", description: "Delivery status created successfully" });
      fetchData();
      setIsCreateOpen(false);
      setFormData({ statusName: "", description: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !formData.statusName) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/delivery-statuses/${selectedItem.DeliveryStatusId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update delivery status");
      toast({ title: "Success", description: "Delivery status updated successfully" });
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/delivery-statuses/${selectedItem.DeliveryStatusId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete delivery status");
      toast({ title: "Success", description: "Delivery status deleted successfully" });
      fetchData();
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEdit = (item: DeliveryStatus) => {
    setSelectedItem(item);
    setFormData({ statusName: item.StatusName, description: item.Description || "" });
    setIsEditOpen(true);
  };

  const openDelete = (item: DeliveryStatus) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Truck className="w-7 h-7 text-primary" />
              Delivery Statuses
            </h1>
            <p className="text-muted-foreground">Manage delivery status options</p>
          </div>
          <Button className="gradient-primary" onClick={() => { setFormData({ statusName: "", description: "" }); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search statuses..." 
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
              <p className="text-muted-foreground">Loading delivery statuses...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No delivery statuses found.</TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.DeliveryStatusId}>
                      <TableCell>
                        <Badge variant="secondary">{item.StatusName}</Badge>
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
        title="Add Delivery Status"
        saveLabel="Create"
        onSave={handleCreate}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Status Name *</Label>
            <Input value={formData.statusName} onChange={(e) => setFormData({ ...formData, statusName: e.target.value })} placeholder="Enter status name" />
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
        title="Edit Delivery Status"
        saveLabel="Save Changes"
        mode="edit"
        onSave={handleUpdate}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Status Name *</Label>
            <Input value={formData.statusName} onChange={(e) => setFormData({ ...formData, statusName: e.target.value })} placeholder="Enter status name" />
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
        title="Delete Delivery Status"
        description={`Are you sure you want to delete "${selectedItem?.StatusName}"? This action cannot be undone.`}
      />
    </SettingsLayout>
  );
}
