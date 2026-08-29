import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import { FileText, Plus, Search, Filter, Download, Eye, MoreHorizontal, Edit, Trash2, Loader2, Send, CheckCircle, XCircle, Upload, Link2, RefreshCw, FileUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface Proposal {
  ProposalId: number;
  ProposalNumber?: string;
  ProposalTitle: string;
  DealId: number | string;
  DealNumber?: string;
  DealName?: string;
  AccountName?: string;
  ContactFirstName?: string;
  ContactLastName?: string;
  DealStageName?: string;
  ProposalAmount: number | string;
  Currency: string;
  VersionNo: string;
  ParentProposalId?: number | null;
  ValidityDate: string;
  PaymentTerms: string;
  DeliveryTerms: string;
  InternalNotes: string;
  RejectionReason?: string | null;
  ProposalStatusId: number;
  ProposalStatusName: string;
  ProposalDocumentPath?: string | null;
  SubmittedAt?: string | null;
  ApprovedAt?: string | null;
  RejectedAt?: string | null;
  CreatedByName?: string;
  ApprovedByName?: string;
}

interface ProposalFormFieldsProps {
  formData: Partial<Proposal>;
  setFormData: Dispatch<SetStateAction<Partial<Proposal>>>;
  deals: any[];
  selectedItem: Proposal | null;
  readOnly?: boolean;
  mode?: "create" | "edit" | "view";
}

interface RejectionFormData {
  Reason: string;
  DetailedFeedback: string;
  CompetitorWon: string;
}

const getAuthHeaders = (json = true) => {
  const token = localStorage.getItem("token");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft": return "bg-muted text-muted-foreground";
    case "Submitted": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Under Review": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Approved": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Rejected": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case "Expired": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    case "Rejected/Expired": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    default: return "bg-secondary";
  }
};

const getStatusCardColor = (status: string) => {
  switch (status) {
    case "Draft": return "bg-muted/5";
    case "Submitted": return "bg-blue-500/5";
    case "Under Review": return "bg-amber-500/5";
    case "Approved": return "bg-emerald-500/5";
    case "Rejected": return "bg-rose-500/5";
    case "Expired": return "bg-gray-500/5";
    case "Rejected/Expired": return "bg-gray-500/5";
    default: return "bg-secondary/5";
  }
};

const getStatusTextColor = (status: string) => {
  switch (status) {
    case "Draft": return "text-muted-foreground";
    case "Submitted": return "text-blue-600";
    case "Under Review": return "text-amber-600";
    case "Approved": return "text-emerald-600";
    case "Rejected": return "text-rose-600";
    case "Expired": return "text-gray-600";
    case "Rejected/Expired": return "text-gray-600";
    default: return "text-secondary-foreground";
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatCurrency = (amount: number, currency: string = "INR") => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
};

// Helper function to check if proposal is in a terminal state (no actions allowed except linking appointments)
const isTerminalState = (statusId: number) => {
  // Status IDs that are terminal (no further actions allowed)
  const terminalStatusIds = [4, 6, 7]; // APPROVED: 4, EXPIRED: 6, REJECTED_EXPIRED: 7
  return terminalStatusIds.includes(statusId);
};

// Helper function to check if link appointment action should be allowed
const canLinkAppointment = (statusId: number, statusName: string) => {
  // Allow linking appointments for these statuses
  const allowedStatuses = ["Expired", "Rejected/Expired", "Approved"];
  return allowedStatuses.includes(statusName);
};

const ProposalFormFields = ({ formData, setFormData, deals, selectedItem, readOnly = false, mode = "create" }: ProposalFormFieldsProps) => (
  <div className="space-y-4 py-2">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Proposal Title *</Label>
        <Input
          value={formData.ProposalTitle || ""}
          onChange={(e) => setFormData({ ...formData, ProposalTitle: e.target.value })}
          placeholder="Enter proposal title"
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Deal *</Label>
        {(mode === "edit" || mode === "view") ? (
          <Input
            value={
              selectedItem?.DealName ||
              (deals.find(d => String(d.DealId) === String(formData.DealId))?.DealName) ||
              "N/A"
            }
            readOnly
            className="bg-muted"
          />
        ) : (
          <Select
            value={formData.DealId?.toString()}
            onValueChange={(val) => setFormData({ ...formData, DealId: parseInt(val) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select deal" />
            </SelectTrigger>
            <SelectContent>
              {deals.map((deal) => (
                <SelectItem key={deal.DealId} value={deal.DealId.toString()}>
                  {deal.DealNumber ? `${deal.DealNumber} - ` : ""}
                  {deal.DealName || "Unnamed Deal"}
                  {deal.AccountName ? ` (${deal.AccountName})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Amount *</Label>
        <Input
          type="number"
          value={formData.ProposalAmount || ""}
          onChange={(e) => setFormData({ ...formData, ProposalAmount: e.target.value })}
          placeholder="0.00"
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Currency *</Label>
        {readOnly ? (
          <Input value={formData.Currency || ""} readOnly className="bg-muted" />
        ) : (
          <Select
            value={formData.Currency}
            onValueChange={(val) => setFormData({ ...formData, Currency: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "CNY"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {(mode === "edit" || mode === "view") && (
        <div className="space-y-2">
          <Label>Version</Label>
          <Input value={selectedItem?.VersionNo || "1.0"} readOnly className="bg-muted" />
        </div>
      )}
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Validity Date</Label>
        <Input
          type="date"
          value={formData.ValidityDate || ""}
          onChange={(e) => setFormData({ ...formData, ValidityDate: e.target.value })}
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
      {(mode === "edit" || mode === "view") && (
        <div className="space-y-2">
          <Label>Parent Proposal</Label>
          <Input value={selectedItem?.ParentProposalId ? String(selectedItem.ParentProposalId) : "None"} readOnly className="bg-muted" />
        </div>
      )}
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Payment Terms</Label>
        <Input
          value={formData.PaymentTerms || ""}
          onChange={(e) => setFormData({ ...formData, PaymentTerms: e.target.value })}
          placeholder="e.g., Net 30"
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Delivery Terms</Label>
        <Input
          value={formData.DeliveryTerms || ""}
          onChange={(e) => setFormData({ ...formData, DeliveryTerms: e.target.value })}
          placeholder="e.g., 6 weeks"
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Internal Notes</Label>
      <Textarea
        value={formData.InternalNotes || ""}
        onChange={(e) => setFormData({ ...formData, InternalNotes: e.target.value })}
        placeholder="Enter internal notes"
        readOnly={readOnly}
        className={readOnly ? "bg-muted font-normal min-h-24" : "font-normal min-h-24"}
      />
    </div>
    {readOnly && selectedItem && (
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div><Label className="text-xs uppercase text-muted-foreground">Created By</Label><p className="text-sm mt-1">{selectedItem.CreatedByName || "N/A"}</p></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Approved By</Label><p className="text-sm mt-1">{selectedItem.ApprovedByName || "N/A"}</p></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Submitted At</Label><p className="text-sm mt-1">{formatDateTime(selectedItem.SubmittedAt)}</p></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Approved At</Label><p className="text-sm mt-1">{formatDateTime(selectedItem.ApprovedAt)}</p></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Rejected At</Label><p className="text-sm mt-1">{formatDateTime(selectedItem.RejectedAt)}</p></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Rejection Reason</Label><p className="text-sm mt-1">{selectedItem.RejectionReason || "N/A"}</p></div>
        <div><Label className="text-xs uppercase text-muted-foreground">Document</Label><p className="text-sm mt-1">{selectedItem.ProposalDocumentPath ? "Uploaded" : "Not uploaded"}</p></div>
      </div>
    )}
  </div>
);

export default function Proposals() {
  const [data, setData] = useState<Proposal[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Proposal | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [linkAppointmentId, setLinkAppointmentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Proposal>>({
    ProposalTitle: "",
    DealId: "",
    ProposalAmount: "",
    Currency: "USD",
    ValidityDate: "",
    PaymentTerms: "",
    DeliveryTerms: "",
    InternalNotes: ""
  });

  const [globalDealSelection, setGlobalDealSelection] = useState<string[]>([]);

  const [rejectionData, setRejectionData] = useState<RejectionFormData>({
    Reason: "",
    DetailedFeedback: "",
    CompetitorWon: ""
  });

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      const isIdList = searchQuery && /^(\d+,\s*)*\d+$/.test(searchQuery.trim());

      if (searchQuery) {
        if (isIdList) {
          params.append("dealId", searchQuery.replace(/\s+/g, ""));
        } else {
          params.append("search", searchQuery);
        }
      }

      const [propsRes, statusRes, appointmentsRes, reasonsRes, pendingRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/proposals?${params}`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/proposals/statuses`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/appointments?requireDealId=true&limit=1000`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/proposals/rejection-reasons`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/proposals/pending-approval`, { headers: getAuthHeaders() }),
      ]);

      if (!propsRes.ok) throw new Error("Failed to fetch proposals");

      const propsData = await propsRes.json();
      const statusData = await statusRes.json();
      const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : { data: [] };
      const reasonsData = reasonsRes.ok ? await reasonsRes.json() : { data: [] };
      const pendingData = pendingRes.ok ? await pendingRes.json() : { data: [] };

      setData(propsData.data || propsData.proposals || []);
      setStatuses(statusData.data || []);
      setAppointments(appointmentsData.data || appointmentsData.appointments || []);
      setRejectionReasons(reasonsData.data || []);
      setPendingApprovals(pendingData.data || []);

      // Load deals eligible for proposal creation:
      // - stageId >= 3
      // - exclude Closed Won = 6
      // - exclude Closed Lost = 7
      const allowedDealStageIds = [3, 4, 5];

      const dealsByStage = await Promise.all(
        allowedDealStageIds.map(async (stageId) => {
          const res = await fetch(
            `${BACKEND_BASE_URL}/api/deals?page=1&limit=1000&DealStageId=${stageId}`,
            { headers: getAuthHeaders() }
          );

          if (!res.ok)
            throw new Error(`Failed to fetch deals for stage ${stageId}`);

          const result = await res.json();
          return result.data || [];
        })
      );
      const seen = new Set<string>();
      const mergedDeals: any[] = [];
      for (const stageDeals of dealsByStage) {
        for (const d of stageDeals) {
          const id = String(d.DealId);
          if (!seen.has(id)) {
            seen.add(id);
            mergedDeals.push(d);
          }
        }
      }
      setDeals(mergedDeals);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast, searchQuery]);

  useEffect(() => {
    const saved = localStorage.getItem("globalDealSelection");
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setGlobalDealSelection(ids);
        if (ids.length > 0) {
          setSearchQuery(ids.join(", "));
        }
      } catch (e) { console.error(e); }
    }
  }, []); // Run only once on mount

  useEffect(() => {
    fetchData();
  }, [searchQuery]); // Fetch when search query changes

  // Calculate statistics
  const totalProposals = data.length;
  const totalValue = data.reduce((sum, proposal) => sum + Number(proposal.ProposalAmount), 0);
  const readyToSubmit = data.filter((proposal) => proposal.ProposalStatusName === "Draft" && proposal.ProposalDocumentPath).length;
  const approvedCount = data.filter((proposal) => proposal.ProposalStatusName === "Approved").length;
  const approvedValue = data.reduce((sum, proposal) =>
    proposal.ProposalStatusName === "Approved" ? sum + Number(proposal.ProposalAmount) : sum, 0
  );

  // Status wise calculations
  const getStatusCount = (statusName: string) => {
    return data.filter((proposal) => proposal.ProposalStatusName === statusName).length;
  };

  const getStatusValue = (statusName: string) => {
    return data.reduce((sum, proposal) =>
      proposal.ProposalStatusName === statusName ? sum + Number(proposal.ProposalAmount) : sum, 0
    );
  };

  const filteredData = data.filter((item) => {
    const isIdList = searchQuery && /^(\d+,\s*)*\d+$/.test(searchQuery.trim());
    const matchesSearch = isIdList ||
      item.ProposalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.DealName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.DealNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.AccountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ContactFirstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ContactLastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ProposalNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.ProposalStatusId.toString() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      ProposalTitle: "",
      DealId: "",
      ProposalAmount: "",
      Currency: "USD",
      ValidityDate: "",
      PaymentTerms: "",
      DeliveryTerms: "",
      InternalNotes: ""
    });
  };

  const resetActionState = () => {
    setSelectedFile(null);
    setApprovalNotes("");
    setLinkAppointmentId("");
    setRejectionData({ Reason: "", DetailedFeedback: "", CompetitorWon: "" });
  };

  const handleCreate = async () => {
    try {
      if (!formData.DealId) {
        toast({ title: "Error", description: "Please select a deal", variant: "destructive" });
        return;
      }
      const res = await fetch(`${BACKEND_BASE_URL}/api/proposals`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          ProposalAmount: parseFloat(formData.ProposalAmount as string)
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create proposal");
      }
      toast({ title: "Success", description: "Proposal created successfully" });
      fetchData(false);
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/proposals/${selectedItem.ProposalId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          ProposalAmount: parseFloat(formData.ProposalAmount as string)
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update proposal");
      }
      toast({ title: "Success", description: "Proposal updated successfully" });
      fetchData(false);
      setIsEditOpen(false);
      setSelectedItem(null);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/proposals/${selectedItem.ProposalId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete proposal");
      }
      toast({ title: "Success", description: "Proposal deleted successfully" });
      fetchData(false);
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Enhanced handleAction with proper error handling and toasts
  const handleAction = async (action: string, id: number, body?: unknown) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/proposals/${id}/${action}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Failed to ${action} proposal`);
      }
      const result = await res.json();
      toast({ title: "Success", description: result.message || `Proposal ${action}ed successfully` });
      fetchData(false);
      return result;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error; // Re-throw to let calling functions handle if needed
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedItem || !selectedFile) {
      toast({ title: "Error", description: "Please choose a PDF document", variant: "destructive" });
      return;
    }
    const payload = new FormData();
    payload.append("proposalDocument", selectedFile);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/proposals/${selectedItem.ProposalId}/upload-document`, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: payload,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to upload proposal document");
      }
      toast({ title: "Success", description: "Proposal document uploaded successfully" });
      setIsUploadOpen(false);
      resetActionState();
      fetchData(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      await handleAction("approve", selectedItem.ProposalId, { notes: approvalNotes });
      setIsApproveOpen(false);
      setSelectedItem(null);
      resetActionState();
    } catch (error) {
      // Error is already handled in handleAction, just close dialog if needed? No, keep open if error?
      // We'll keep the dialog open on error by not closing, but error toast is shown.
      // No state changes needed here because error is already handled.
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!rejectionData.Reason) {
      toast({ title: "Error", description: "Please select a rejection reason", variant: "destructive" });
      return;
    }
    try {
      await handleAction("reject", selectedItem.ProposalId, rejectionData);
      setIsRejectOpen(false);
      setSelectedItem(null);
      resetActionState();
    } catch (error) {
      // Error handled in handleAction
    }
  };

  const handleLinkAppointment = async () => {
    if (!selectedItem || !linkAppointmentId) {
      toast({ title: "Error", description: "Please select an appointment", variant: "destructive" });
      return;
    }
    try {
      await handleAction("link-appointment", selectedItem.ProposalId, { appointmentId: Number(linkAppointmentId) });
      setIsLinkOpen(false);
      setSelectedItem(null);
      resetActionState();
    } catch (error) {
      // Error handled in handleAction
    }
  };

  const handleCreateRevision = async (proposal: Proposal) => {
    try {
      await handleAction("create-revision", proposal.ProposalId);
    } catch (error) {
      // Error handled in handleAction
    }
  };

  const handleSubmitProposal = async (proposal: Proposal) => {
    if (!proposal.ProposalDocumentPath) {
      setSelectedItem(proposal);
      setIsUploadOpen(true);
      toast({ title: "Document required", description: "Upload the proposal document first, then submit it." });
      return;
    }
    try {
      await handleAction("submit", proposal.ProposalId);
    } catch (error) {
      // Error handled in handleAction
    }
  };

  const downloadDocument = async (proposal: Proposal) => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/proposals/${proposal.ProposalId}/download-document`, {
        headers: getAuthHeaders(false),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to download document");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${proposal.ProposalNumber || `proposal_${proposal.ProposalId}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openView = (proposal: Proposal) => {
    setSelectedItem(proposal);
    setFormData({
      ProposalTitle: proposal.ProposalTitle,
      DealId: proposal.DealId,
      ProposalAmount: proposal.ProposalAmount.toString(),
      Currency: proposal.Currency,
      ValidityDate: proposal.ValidityDate ? proposal.ValidityDate.split("T")[0] : "",
      PaymentTerms: proposal.PaymentTerms,
      DeliveryTerms: proposal.DeliveryTerms,
      InternalNotes: proposal.InternalNotes,
      RejectionReason: proposal.RejectionReason || ""
    });
    setIsViewOpen(true);
  };

  const openEdit = (proposal: Proposal) => {
    setSelectedItem(proposal);
    setFormData({
      ProposalTitle: proposal.ProposalTitle,
      DealId: proposal.DealId,
      ProposalAmount: proposal.ProposalAmount.toString(),
      Currency: proposal.Currency,
      ValidityDate: proposal.ValidityDate ? proposal.ValidityDate.split("T")[0] : "",
      PaymentTerms: proposal.PaymentTerms,
      DeliveryTerms: proposal.DeliveryTerms,
      InternalNotes: proposal.InternalNotes
    });
    setIsEditOpen(true);
  };

  const openUpload = (proposal: Proposal) => {
    setSelectedItem(proposal);
    setSelectedFile(null);
    setIsUploadOpen(true);
  };

  const openApprove = (proposal: Proposal) => {
    setSelectedItem(proposal);
    setApprovalNotes("");
    setIsApproveOpen(true);
  };

  const openReject = (proposal: Proposal) => {
    setSelectedItem(proposal);
    setRejectionData({
      Reason: proposal.RejectionReason || "",
      DetailedFeedback: "",
      CompetitorWon: ""
    });
    setIsRejectOpen(true);
  };

  const openLink = (proposal: Proposal) => {
    setSelectedItem(proposal);
    setLinkAppointmentId("");
    setIsLinkOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <FileText className="w-7 h-7 text-primary" />
              Proposals
            </h1>
            <p className="text-muted-foreground">Create, upload, submit, approve, reject, revise, and link proposal activity in one place.</p>
          </div>
          <Button className="gradient-primary" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Proposal
          </Button>
        </div>

        {/* Status Cards Row - All statuses in one line with Total card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
          {/* Total Status Card */}
          <Card className="card-elevated border-none bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Total Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProposals}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalValue)} total value</p>
            </CardContent>
          </Card>

          {/* Draft Status Card */}
          <Card className="card-elevated border-none bg-muted/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getStatusCount("Draft")}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(getStatusValue("Draft"))}</p>
            </CardContent>
          </Card>

          {/* Submitted Status Card */}
          <Card className="card-elevated border-none bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-500">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{getStatusCount("Submitted")}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(getStatusValue("Submitted"))}</p>
            </CardContent>
          </Card>

          {/* Under Review Status Card */}
          <Card className="card-elevated border-none bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-500">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{getStatusCount("Under Review")}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(getStatusValue("Under Review"))}</p>
            </CardContent>
          </Card>

          {/* Approved Status Card */}
          <Card className="card-elevated border-none bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-500">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{getStatusCount("Approved")}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(getStatusValue("Approved"))}</p>
            </CardContent>
          </Card>

          {/* Rejected Status Card */}
          <Card className="card-elevated border-none bg-rose-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-500">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600">{getStatusCount("Rejected")}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(getStatusValue("Rejected"))}</p>
            </CardContent>
          </Card>

          {/* Expired Status Card */}
          <Card className="card-elevated border-none bg-gray-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{getStatusCount("Expired")}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(getStatusValue("Expired"))}</p>
            </CardContent>
          </Card>

          {/* Rejected Expired Status Card */}
          <Card className="card-elevated border-none bg-gray-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Rejected<br />Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{getStatusCount("Rejected Expired")}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(getStatusValue("Rejected Expired"))}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search proposals..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-11">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.ProposalStatusId} value={status.ProposalStatusId.toString()}>
                  {status.StatusName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isRefreshing && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>

        <div className="card-elevated rounded-xl overflow-hidden border-none shadow-premium">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading proposals...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No proposals found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6 font-bold text-[11px] uppercase tracking-wider">Proposal</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Client / Deal</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Document</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Dates</TableHead>
                  <TableHead className="w-24 pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((proposal) => (
                  <TableRow key={proposal.ProposalId} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6">
                      <div>
                        <div className="font-bold text-sm">{proposal.ProposalTitle}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {proposal.ProposalNumber || `PROP-${String(proposal.ProposalId).padStart(4, "0")}`} | v{proposal.VersionNo}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{proposal.AccountName || "No account"}</div>
                        <div className="text-xs text-muted-foreground">
                          {proposal.DealNumber ? `${proposal.DealNumber} - ` : ""}
                          {proposal.DealName || "No deal"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {proposal.ProposalDocumentPath ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <FileUp className="w-3.5 h-3.5 mr-1" /> Uploaded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
                          Missing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(proposal.ProposalStatusName)} border shadow-none font-bold text-[10px] uppercase tracking-tighter px-2 py-0.5`}
                      >
                        {proposal.ProposalStatusName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(Number(proposal.ProposalAmount), proposal.Currency)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>Valid: {formatDate(proposal.ValidityDate)}</div>
                      <div>Submitted: {formatDate(proposal.SubmittedAt)}</div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 shadow-premium border-muted/50">
                            <DropdownMenuItem onClick={() => openView(proposal)} className="gap-2">
                              <Eye className="w-4 h-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEdit(proposal)}
                              className="gap-2"
                              disabled={isTerminalState(proposal.ProposalStatusId)}
                            >
                              <Edit className="w-4 h-4" /> Edit Proposal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openUpload(proposal)}
                              className="gap-2"
                              disabled={isTerminalState(proposal.ProposalStatusId)}
                            >
                              <Upload className="w-4 h-4 text-primary" />
                              {proposal.ProposalDocumentPath ? "Replace Document" : "Upload Document"}
                            </DropdownMenuItem>
                            {/* Link Appointment - Always enabled for Expired, Rejected/Expired, and Approved */}
                            <DropdownMenuItem
                              onClick={() => openLink(proposal)}
                              className="gap-2"
                            >
                              <Link2 className="w-4 h-4 text-blue-500" /> Link Appointment
                            </DropdownMenuItem>
                            {proposal.ProposalDocumentPath && (
                              <DropdownMenuItem onClick={() => downloadDocument(proposal)} className="gap-2">
                                <Download className="w-4 h-4" /> Download Document
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {proposal.ProposalStatusName === "Draft" && (
                              <DropdownMenuItem onClick={() => handleSubmitProposal(proposal)} className="gap-2 text-primary">
                                <Send className="w-4 h-4" /> Submit Proposal
                              </DropdownMenuItem>
                            )}
                            {(proposal.ProposalStatusName === "Submitted" || proposal.ProposalStatusName === "Under Review") && (
                              <>
                                <DropdownMenuItem onClick={() => openApprove(proposal)} className="gap-2 text-emerald-500">
                                  <CheckCircle className="w-4 h-4" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openReject(proposal)} className="gap-2 text-rose-500">
                                  <XCircle className="w-4 h-4" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {proposal.ProposalStatusName === "Rejected" && (
                              <DropdownMenuItem onClick={() => handleCreateRevision(proposal)} className="gap-2 text-amber-600">
                                <RefreshCw className="w-4 h-4" /> Create Revision
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-500 gap-2"
                              onClick={() => { setSelectedItem(proposal); setIsDeleteOpen(true); }}
                              disabled={isTerminalState(proposal.ProposalStatusId)}
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create New Proposal" saveLabel="Draft Proposal" onSave={handleCreate}>
        <ProposalFormFields mode="create" formData={formData} setFormData={setFormData} deals={deals} selectedItem={selectedItem} />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="Proposal Details" mode="view">
        <ProposalFormFields mode="view" formData={formData} setFormData={setFormData} deals={deals} selectedItem={selectedItem} readOnly />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Proposal" saveLabel="Update Proposal" mode="edit" onSave={handleUpdate}>
        <ProposalFormFields mode="edit" formData={formData} setFormData={setFormData} deals={deals} selectedItem={selectedItem} />
      </CrudDialog>

      <CrudDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} title="Upload Proposal Document" saveLabel="Upload Document" onSave={handleUploadDocument}>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-dashed bg-muted/30 p-4">
            <p className="text-sm font-medium">{selectedItem?.ProposalTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF upload is required before a draft proposal can be submitted.</p>
          </div>
          <div className="space-y-2">
            <Label>Proposal PDF</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              {selectedFile ? selectedFile.name : selectedItem?.ProposalDocumentPath ? "A document is already attached. Upload to replace it." : "Choose a PDF file to attach."}
            </p>
          </div>
        </div>
      </CrudDialog>

      <CrudDialog open={isApproveOpen} onOpenChange={setIsApproveOpen} title="Approve Proposal" saveLabel="Approve Proposal" onSave={handleApprove}>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4">
            <p className="font-medium text-emerald-700">{selectedItem?.ProposalTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">Approving this proposal will move it forward for sales order creation.</p>
          </div>
          <div className="space-y-2">
            <Label>Approval Notes</Label>
            <Textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Optional approval notes..."
              className="min-h-24"
            />
          </div>
        </div>
      </CrudDialog>

      <CrudDialog open={isRejectOpen} onOpenChange={setIsRejectOpen} title="Reject Proposal" saveLabel="Reject Proposal" onSave={handleReject}>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Rejection Reason *</Label>
            <Select value={rejectionData.Reason} onValueChange={(val) => setRejectionData({ ...rejectionData, Reason: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {rejectionReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Detailed Feedback</Label>
            <Textarea
              value={rejectionData.DetailedFeedback}
              onChange={(e) => setRejectionData({ ...rejectionData, DetailedFeedback: e.target.value })}
              placeholder="Why is this proposal being rejected?"
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <Label>Competitor Won</Label>
            <Input
              value={rejectionData.CompetitorWon}
              onChange={(e) => setRejectionData({ ...rejectionData, CompetitorWon: e.target.value })}
              placeholder="Optional competitor name"
            />
          </div>
        </div>
      </CrudDialog>

      <CrudDialog open={isLinkOpen} onOpenChange={setIsLinkOpen} title="Link Appointment" saveLabel="Link Appointment" onSave={handleLinkAppointment}>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Appointment</Label>
            <Select value={linkAppointmentId} onValueChange={setLinkAppointmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select appointment" />
              </SelectTrigger>
              <SelectContent>
                {appointments.map((appointment) => (
                  <SelectItem key={appointment.AppointmentId} value={appointment.AppointmentId.toString()}>
                    {appointment.AppointmentNumber || appointment.AppointmentId} - {appointment.Title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
        title="Delete Proposal"
        description={`Are you sure you want to delete "${selectedItem?.ProposalTitle}"? This cannot be undone.`}
      />
    </AppLayout>
  );
}