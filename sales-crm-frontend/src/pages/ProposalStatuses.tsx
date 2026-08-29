import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Search, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
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

interface ProposalStatus {
  ProposalStatusId: number;
  StatusName: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function ProposalStatuses() {
  const [data, setData] = useState<ProposalStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProposalStatus | null>(null);
  const [formData, setFormData] = useState({ statusName: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/proposal-statuses`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch proposal statuses");
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/proposal-statuses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          StatusName: formData.statusName  // Send as StatusName
        }),
      });
      if (!res.ok) throw new Error("Failed to create proposal status");
      toast({ title: "Success", description: "Proposal status created successfully" });
      fetchData();
      setIsCreateOpen(false);
      setFormData({ statusName: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !formData.statusName) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/proposal-statuses/${selectedItem.ProposalStatusId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          StatusName: formData.statusName  // Send as StatusName
        }),
      });
      if (!res.ok) throw new Error("Failed to update proposal status");
      toast({ title: "Success", description: "Proposal status updated successfully" });
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/proposal-statuses/${selectedItem.ProposalStatusId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete proposal status");
      toast({ title: "Success", description: "Proposal status deleted successfully" });
      fetchData();
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEdit = (item: ProposalStatus) => {
    setSelectedItem(item);
    setFormData({ statusName: item.StatusName });
    setIsEditOpen(true);
  };

  const openDelete = (item: ProposalStatus) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <FileText className="w-7 h-7 text-primary" />
              Proposal Statuses
            </h1>
            <p className="text-muted-foreground">Manage proposal status options</p>
          </div>
          <Button className="gradient-primary" onClick={() => { setFormData({ statusName: "" }); setIsCreateOpen(true); }}>
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
              <p className="text-muted-foreground">Loading proposal statuses...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status Name</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No proposal statuses found.</TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.ProposalStatusId}>
                      <TableCell>
                        <Badge variant="secondary">{item.StatusName}</Badge>
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
        title="Add Proposal Status"
        saveLabel="Create"
        onSave={handleCreate}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Status Name *</Label>
            <Input 
              value={formData.statusName} 
              onChange={(e) => setFormData({ statusName: e.target.value })} 
              placeholder="Enter status name" 
            />
          </div>
        </div>
      </CrudDialog>

      <CrudDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Proposal Status"
        saveLabel="Save Changes"
        mode="edit"
        onSave={handleUpdate}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Status Name *</Label>
            <Input 
              value={formData.statusName} 
              onChange={(e) => setFormData({ statusName: e.target.value })} 
              placeholder="Enter status name" 
            />
          </div>
        </div>
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        title="Delete Proposal Status"
        description={`Are you sure you want to delete "${selectedItem?.StatusName}"? This action cannot be undone.`}
      />
    </SettingsLayout>
  );
}