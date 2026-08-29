import { useState, useEffect, useCallback } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Globe, Eye, Loader2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface LeadSource {
  id: string;
  sourceName: string;
  sourceType: string;
  description: string;
}

interface SourceFormData {
  sourceName: string;
  sourceType: string;
  description: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (s: any): LeadSource => ({
  id: String(s.SourceId),
  sourceName: s.SourceName || "",
  sourceType: s.SourceType || "",
  description: s.Description || "",
});

const emptyForm: SourceFormData = { sourceName: "", sourceType: "Inbound", description: "" };

const FormFields = ({ 
  data, 
  onChange,
  readOnly = false, 
  isFetching = false 
}: { 
  data: SourceFormData;
  onChange: (d: SourceFormData) => void;
  readOnly?: boolean; 
  isFetching?: boolean 
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching source details...</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Source Name *</Label>
        <Input 
          value={data.sourceName} 
          onChange={(e) => onChange({ ...data, sourceName: e.target.value })} 
          placeholder="e.g. Google Ads" 
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label>Source Type</Label>
        {readOnly ? (
          <Input value={data.sourceType} disabled className="bg-muted" />
        ) : (
          <Select 
            value={data.sourceType} 
            onValueChange={(v) => onChange({ ...data, sourceType: v })}
          >
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Inbound">Inbound</SelectItem>
              <SelectItem value="Outbound">Outbound</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="Events">Events</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          value={data.description} 
          onChange={(e) => onChange({ ...data, description: e.target.value })} 
          placeholder="Add some details..." 
          disabled={readOnly}
        />
      </div>
    </div>
  );
};

export default function LeadSources() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<LeadSource | null>(null);
  const [formData, setFormData] = useState<SourceFormData>(emptyForm);
  const { toast } = useToast();

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/sources`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lead sources");
      const result = await res.json();
      setSources(Array.isArray(result.data) ? result.data.map(mapBackendToFrontend) : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const fetchSourceDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/sources/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lead source details");
      const result = await res.json();
      const s = result.data;
      setFormData({
        sourceName: s.SourceName || "",
        sourceType: s.SourceType || "Inbound",
        description: s.Description || "",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const filteredSources = sources.filter(s =>
    s.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sourceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.sourceName) {
      toast({ title: "Validation Error", description: "Source name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/sources`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          SourceName: formData.sourceName,
          SourceType: formData.sourceType,
          Description: formData.description,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to create"); }
      toast({ title: "Success", description: "Lead source created successfully." });
      fetchSources();
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedSource || !formData.sourceName) {
      toast({ title: "Validation Error", description: "Source name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/sources/${selectedSource.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          SourceName: formData.sourceName,
          SourceType: formData.sourceType,
          Description: formData.description,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to update"); }
      toast({ title: "Success", description: "Lead source updated successfully." });
      fetchSources();
      setIsEditOpen(false);
      setSelectedSource(null);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedSource) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/sources/${selectedSource.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to delete"); }
      toast({ title: "Success", description: "Lead source deleted successfully." });
      fetchSources();
      setIsDeleteOpen(false);
      setSelectedSource(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openView = async (s: LeadSource) => {
    setSelectedSource(s);
    setFormData({ ...emptyForm, sourceName: s.sourceName, sourceType: s.sourceType, description: s.description });
    setIsViewOpen(true);
    await fetchSourceDetail(s.id);
  };
  const openEdit = async (s: LeadSource) => {
    setSelectedSource(s);
    setFormData({ ...emptyForm, sourceName: s.sourceName, sourceType: s.sourceType, description: s.description });
    setIsEditOpen(true);
    await fetchSourceDetail(s.id);
  };
  const openDelete = (s: LeadSource) => { setSelectedSource(s); setIsDeleteOpen(true); };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Globe className="w-7 h-7 text-primary" />
              Lead Sources
            </h1>
            <p className="text-muted-foreground">Manage and track your lead sources</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-glow" onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
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
              <span className="ml-2 text-muted-foreground">Loading sources...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No sources found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.sourceName}</TableCell>
                        <TableCell><Badge variant="secondary">{source.sourceType}</Badge></TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[300px]">{source.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(source)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(source)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => openDelete(source)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
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

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create Lead Source" description="Add a new source for leads" saveLabel="Create Source" onSave={handleCreate}>
        <FormFields data={formData} onChange={setFormData} />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Lead Source" mode="view">
        <FormFields data={formData} onChange={() => {}} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Lead Source" saveLabel="Save Changes" mode="edit" onSave={handleEdit}>
        <FormFields data={formData} onChange={setFormData} isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={handleDelete} title="Delete Source" description="Are you sure you want to delete this lead source?" />
    </SettingsLayout>
  );
}
