import { useState, useEffect, useCallback } from "react";
import { Layers, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface LeadType {
  id: string;
  typeName: string;
  description: string;
  priority: string;
}

interface TypeFormData {
  typeName: string;
  description: string;
  priority: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (t: any): LeadType => ({
  id: String(t.LeadTypeId),
  typeName: t.TypeName || "",
  description: t.Description || "",
  priority: t.Priority || "Medium",
});

const emptyForm: TypeFormData = { typeName: "", description: "", priority: "Medium" };

const FormFields = ({ 
  data, 
  onChange,
  readOnly = false, 
  isFetching = false 
}: { 
  data: TypeFormData;
  onChange: (d: TypeFormData) => void;
  readOnly?: boolean; 
  isFetching?: boolean 
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching type details...</p>
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
          placeholder="e.g. Enterprise" 
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label>Priority</Label>
        <Input 
          value={data.priority} 
          onChange={(e) => onChange({ ...data, priority: e.target.value })} 
          placeholder="e.g. High" 
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          value={data.description} 
          onChange={(e) => onChange({ ...data, description: e.target.value })} 
          placeholder="Details about this lead type..." 
          disabled={readOnly}
        />
      </div>
    </div>
  );
};

export default function LeadTypes() {
  const [types, setTypes] = useState<LeadType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LeadType | null>(null);
  const [formData, setFormData] = useState<TypeFormData>(emptyForm);
  const { toast } = useToast();

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/types`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lead types");
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/types/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lead type details");
      const result = await res.json();
      const t = result.data;
      setFormData({
        typeName: t.TypeName || "",
        description: t.Description || "",
        priority: t.Priority || "Medium",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const filteredTypes = types.filter(t =>
    t.typeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.typeName) {
      toast({ title: "Validation Error", description: "Type name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/types`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          TypeName: formData.typeName,
          Description: formData.description,
          Priority: formData.priority,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to create"); }
      toast({ title: "Success", description: "Lead type created successfully." });
      fetchTypes();
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedType || !formData.typeName) {
      toast({ title: "Validation Error", description: "Type name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/types/${selectedType.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          TypeName: formData.typeName,
          Description: formData.description,
          Priority: formData.priority,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to update"); }
      toast({ title: "Success", description: "Lead type updated successfully." });
      fetchTypes();
      setIsEditOpen(false);
      setSelectedType(null);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/types/${selectedType.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to delete"); }
      toast({ title: "Success", description: "Lead type deleted successfully." });
      fetchTypes();
      setIsDeleteOpen(false);
      setSelectedType(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openView = async (t: LeadType) => {
    setSelectedType(t);
    setFormData({ ...emptyForm, typeName: t.typeName, description: t.description, priority: t.priority });
    setIsViewOpen(true);
    await fetchTypeDetail(t.id);
  };
  const openEdit = async (t: LeadType) => {
    setSelectedType(t);
    setFormData({ ...emptyForm, typeName: t.typeName, description: t.description, priority: t.priority });
    setIsEditOpen(true);
    await fetchTypeDetail(t.id);
  };
  const openDelete = (t: LeadType) => { setSelectedType(t); setIsDeleteOpen(true); };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Layers className="w-7 h-7 text-primary" />
              Lead Types
            </h1>
            <p className="text-muted-foreground">Manage lead categorization types</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-glow" onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading types...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No types found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.typeName}</TableCell>
                        <TableCell><Badge variant="outline">{type.priority}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{type.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(type)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(type)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => openDelete(type)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
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

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create Lead Type" description="Add a new category for your leads" saveLabel="Create Type" onSave={handleCreate}>
        <FormFields data={formData} onChange={setFormData} />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Lead Type" mode="view">
        <FormFields data={formData} onChange={() => {}} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Lead Type" saveLabel="Update Type" mode="edit" onSave={handleEdit}>
        <FormFields data={formData} onChange={setFormData} isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={handleDelete} title="Delete Type" description={`Are you sure you want to delete lead type "${selectedType?.typeName}"?`} />
    </SettingsLayout>
  );
}
