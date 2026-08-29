import { useState, useEffect, useCallback } from "react";
import { PhoneCall, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface LeadFollowUpType {
  id: string;
  typeName: string;
  description: string;
}

interface FollowUpTypeFormData {
  typeName: string;
  description: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (t: any): LeadFollowUpType => ({
  id: String(t.FollowUpTypeId),
  typeName: t.TypeName || "",
  description: t.Description || "",
});

const emptyForm: FollowUpTypeFormData = { typeName: "", description: "" };

const FormFields = ({
  data,
  onChange,
  readOnly = false,
  isFetching = false,
}: {
  data: FollowUpTypeFormData;
  onChange: (d: FollowUpTypeFormData) => void;
  readOnly?: boolean;
  isFetching?: boolean;
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching follow-up type details...</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Type Name *</Label>
        <Input
          value={data.typeName}
          onChange={(e) => onChange({ ...data, typeName: e.target.value })}
          placeholder="Enter type name"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Enter description"
          disabled={readOnly}
        />
      </div>
    </div>
  );
};

export default function LeadFollowUpTypes() {
  const [types, setTypes] = useState<LeadFollowUpType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadFollowUpType | null>(null);
  const [formData, setFormData] = useState<FollowUpTypeFormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/follow-up-types`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lead follow-up types");
      const result = await res.json();
      setTypes(Array.isArray(result.data) ? result.data.map(mapBackendToFrontend) : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const fetchTypeDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/follow-up-types/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch follow-up type details");
      const result = await res.json();
      const t = result.data;
      setFormData({ typeName: t.TypeName || "", description: t.Description || "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const filteredData = types.filter(item =>
    item.typeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.typeName) {
      toast({ title: "Validation Error", description: "Type name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/follow-up-types`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ TypeName: formData.typeName, Description: formData.description }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to create"); }
      toast({ title: "Success", description: "Lead follow-up type created successfully." });
      fetchTypes();
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !formData.typeName) {
      toast({ title: "Validation Error", description: "Type name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/follow-up-types/${selectedItem.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ TypeName: formData.typeName, Description: formData.description }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to update"); }
      toast({ title: "Success", description: "Lead follow-up type updated successfully." });
      fetchTypes();
      setIsEditOpen(false);
      setSelectedItem(null);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/follow-up-types/${selectedItem.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to delete"); }
      toast({ title: "Success", description: "Lead follow-up type deleted successfully." });
      fetchTypes();
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openView = async (item: LeadFollowUpType) => {
    setSelectedItem(item);
    setFormData({ typeName: item.typeName, description: item.description });
    setIsViewOpen(true);
    await fetchTypeDetail(item.id);
  };
  const openEdit = async (item: LeadFollowUpType) => {
    setSelectedItem(item);
    setFormData({ typeName: item.typeName, description: item.description });
    setIsEditOpen(true);
    await fetchTypeDetail(item.id);
  };
  const openDelete = (item: LeadFollowUpType) => { setSelectedItem(item); setIsDeleteOpen(true); };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <PhoneCall className="w-7 h-7 text-primary" />
              Lead Follow-Up Types
            </h1>
            <p className="text-muted-foreground">Manage the follow-up types used for leads</p>
          </div>
          <Button className="gradient-primary" onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Follow-Up Type
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search follow-up types..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading follow-up types...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No follow-up types found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell><Badge variant="secondary">{item.typeName}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{item.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(item)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(item)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => openDelete(item)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Add Follow-Up Type" description="Create a new lead follow-up type" saveLabel="Create" onSave={handleCreate}>
        <FormFields data={formData} onChange={setFormData} />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Follow-Up Type" mode="view">
        <FormFields data={formData} onChange={() => {}} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Follow-Up Type" saveLabel="Save Changes" mode="edit" onSave={handleEdit}>
        <FormFields data={formData} onChange={setFormData} isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={handleDelete} title="Delete Follow-Up Type" description="Are you sure you want to delete this lead follow-up type?" />
    </SettingsLayout>
  );
}