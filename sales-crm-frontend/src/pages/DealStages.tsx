import { useState, useEffect, useCallback } from "react";
import { Layers, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Loader2, ArrowUpDown } from "lucide-react";
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

interface DealStage {
  id: string;
  stageName: string;
  probability: number;
  displayOrder: number;
  description: string;
}

interface StageFormData {
  stageName: string;
  probability: string;
  displayOrder: string;
  description: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (s: any): DealStage => ({
  id: String(s.DealStageId),
  stageName: s.StageName || "",
  probability: s.Probability || 0,
  displayOrder: s.DisplayOrder || 0,
  description: s.Description || "",
});

const emptyForm: StageFormData = { stageName: "", probability: "0", displayOrder: "0", description: "" };

const FormFields = ({ 
  data, 
  onChange,
  readOnly = false, 
  isFetching = false 
}: { 
  data: StageFormData;
  onChange: (d: StageFormData) => void;
  readOnly?: boolean; 
  isFetching?: boolean 
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching stage details...</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Stage Name *</Label>
        <Input
          value={data.stageName}
          onChange={(e) => onChange({ ...data, stageName: e.target.value })}
          placeholder="e.g. Qualification"
          disabled={readOnly}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Probability (%)</Label>
          <Input
            type="number"
            value={data.probability}
            onChange={(e) => onChange({ ...data, probability: e.target.value })}
            placeholder="0-100"
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input
            type="number"
            value={data.displayOrder}
            onChange={(e) => onChange({ ...data, displayOrder: e.target.value })}
            placeholder="Sort order"
            disabled={readOnly}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Enter stage description"
          disabled={readOnly}
        />
      </div>
    </div>
  );
};

export default function DealStages() {
  const [stages, setStages] = useState<DealStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DealStage | null>(null);
  const [formData, setFormData] = useState<StageFormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchStages = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/deals/stages`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch deal stages");
      const result = await res.json();
      setStages(Array.isArray(result.data) ? result.data.map(mapBackendToFrontend) : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setStages([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  const fetchStageDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/deals/stages/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch deal stage details");
      const result = await res.json();
      const s = result.data;
      setFormData({
        stageName: s.StageName || "",
        probability: String(s.Probability || 0),
        displayOrder: String(s.DisplayOrder || 0),
        description: s.Description || ""
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const filteredData = stages.filter(item =>
    item.stageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.stageName) {
      toast({ title: "Validation Error", description: "Stage name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/deals/stages`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          StageName: formData.stageName,
          Probability: parseInt(formData.probability),
          DisplayOrder: parseInt(formData.displayOrder),
          Description: formData.description
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to create"); }
      toast({ title: "Success", description: "Deal stage created successfully." });
      fetchStages();
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !formData.stageName) {
      toast({ title: "Validation Error", description: "Stage name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/deals/stages/${selectedItem.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          StageName: formData.stageName,
          Probability: parseInt(formData.probability),
          DisplayOrder: parseInt(formData.displayOrder),
          Description: formData.description
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to update"); }
      toast({ title: "Success", description: "Deal stage updated successfully." });
      fetchStages();
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/deals/stages/${selectedItem.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to delete"); }
      toast({ title: "Success", description: "Deal stage deleted successfully." });
      fetchStages();
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openView = async (item: DealStage) => {
    setSelectedItem(item);
    setFormData({
      stageName: item.stageName,
      probability: String(item.probability),
      displayOrder: String(item.displayOrder),
      description: item.description
    });
    setIsViewOpen(true);
    await fetchStageDetail(item.id);
  };
  const openEdit = async (item: DealStage) => {
    setSelectedItem(item);
    setFormData({
      stageName: item.stageName,
      probability: String(item.probability),
      displayOrder: String(item.displayOrder),
      description: item.description
    });
    setIsEditOpen(true);
    await fetchStageDetail(item.id);
  };
  const openDelete = (item: DealStage) => { setSelectedItem(item); setIsDeleteOpen(true); };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Layers className="w-7 h-7 text-primary" />
              Deal Stages
            </h1>
            <p className="text-muted-foreground">Configure your sales pipeline stages</p>
          </div>
          <Button className="gradient-primary shadow-glow" onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Stage
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search stages..." className="pl-10 shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="card-elevated rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading stages...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Stage Name</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No stages found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="font-medium text-center">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full p-0">
                            {item.displayOrder}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{item.stageName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: `${item.probability}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{item.probability}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-xs">{item.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openView(item)} className="cursor-pointer"><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(item)} className="cursor-pointer"><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => openDelete(item)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
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

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Add Deal Stage" description="Create a new stage for your sales pipeline" saveLabel="Create Stage" onSave={handleCreate}>
        <FormFields data={formData} onChange={setFormData} />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="View Deal Stage" mode="view">
        <FormFields data={formData} onChange={() => {}} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Deal Stage" saveLabel="Save Changes" mode="edit" onSave={handleEdit}>
        <FormFields data={formData} onChange={setFormData} isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={handleDelete} title="Delete Stage" description={`Are you sure you want to delete the stage "${selectedItem?.stageName}"? This cannot be undone.`} />
    </SettingsLayout>
  );
}
