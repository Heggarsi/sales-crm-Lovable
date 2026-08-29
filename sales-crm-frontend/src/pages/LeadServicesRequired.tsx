import { useState, useEffect, useCallback } from "react";
import { Wrench, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from "lucide-react";
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

interface LeadService {
  id: string;
  serviceName: string;
  description: string;
}

interface ServiceFormData {
  serviceName: string;
  description: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (s: any): LeadService => ({
  id: String(s.ServiceRequiredId),
  serviceName: s.ServiceName || "",
  description: s.Description || "",
});

const emptyForm: ServiceFormData = { serviceName: "", description: "" };

const FormFields = ({
  data,
  onChange,
  readOnly = false,
  isFetching = false,
}: {
  data: ServiceFormData;
  onChange: (d: ServiceFormData) => void;
  readOnly?: boolean;
  isFetching?: boolean;
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching service details...</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Service Name *</Label>
        <Input
          value={data.serviceName}
          onChange={(e) => onChange({ ...data, serviceName: e.target.value })}
          placeholder="Enter service name"
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

export default function LeadServicesRequired() {
  const [services, setServices] = useState<LeadService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadService | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/services`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lead services");
      const result = await res.json();
      setServices(Array.isArray(result.data) ? result.data.map(mapBackendToFrontend) : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const fetchServiceDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/services/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch service details");
      const result = await res.json();
      const s = result.data;
      setFormData({ serviceName: s.ServiceName || "", description: s.Description || "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const filteredData = services.filter(item =>
    item.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.serviceName) {
      toast({ title: "Validation Error", description: "Service name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/services`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ServiceName: formData.serviceName, Description: formData.description }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to create"); }
      toast({ title: "Success", description: "Lead service created successfully." });
      fetchServices();
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !formData.serviceName) {
      toast({ title: "Validation Error", description: "Service name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/services/${selectedItem.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ServiceName: formData.serviceName, Description: formData.description }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to update"); }
      toast({ title: "Success", description: "Lead service updated successfully." });
      fetchServices();
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/services/${selectedItem.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to delete"); }
      toast({ title: "Success", description: "Lead service deleted successfully." });
      fetchServices();
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openView = async (item: LeadService) => {
    setSelectedItem(item);
    setFormData({ serviceName: item.serviceName, description: item.description });
    setIsViewOpen(true);
    await fetchServiceDetail(item.id);
  };
  const openEdit = async (item: LeadService) => {
    setSelectedItem(item);
    setFormData({ serviceName: item.serviceName, description: item.description });
    setIsEditOpen(true);
    await fetchServiceDetail(item.id);
  };
  const openDelete = (item: LeadService) => { setSelectedItem(item); setIsDeleteOpen(true); };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Wrench className="w-7 h-7 text-primary" />
              Lead Services Required
            </h1>
            <p className="text-muted-foreground">Manage the services a lead may require</p>
          </div>
          <Button className="gradient-primary" onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search services..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading services...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No services found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell><Badge variant="secondary">{item.serviceName}</Badge></TableCell>
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

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Add Lead Service" description="Create a new lead service" saveLabel="Create" onSave={handleCreate}>
        <FormFields data={formData} onChange={setFormData} />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Lead Service" mode="view">
        <FormFields data={formData} onChange={() => {}} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Lead Service" saveLabel="Save Changes" mode="edit" onSave={handleEdit}>
        <FormFields data={formData} onChange={setFormData} isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={handleDelete} title="Delete Service" description="Are you sure you want to delete this lead service?" />
    </SettingsLayout>
  );
}