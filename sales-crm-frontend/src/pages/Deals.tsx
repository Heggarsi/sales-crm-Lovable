import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Loader2, DollarSign, Calendar, Building2, User, Target, TrendingUp, FilePlus, CalendarPlus, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface Deal {
  id: string;
  dealNumber: string;
  dealName: string;
  dealStageId: string;
  stageName: string;
  stageProbability: number;
  closingDate: string;
  accountId: string;
  accountName: string;
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  amount: number;
  probability: number;
  dealType: string;
  leadSource: string;
  expectedRevenue: number;
  description: string;
  assignedToUserId: string;
  assignedToName: string;
  creatorName: string;
  createdAt: string;
}

interface DealFormData {
  dealName: string;
  dealStageId: string;
  closingDate: string;
  accountId: string;
  contactId: string;
  amount: string;
  probability: string;
  dealType: string;
  leadSource: string;
  description: string;
  assignedToUserId: string;
}

interface AccountOption { AccountId: number; AccountName: string; }
interface ContactOption { ContactId: number; FirstName: string; LastName: string; }
interface UserOption { UserId: number; Name: string; }
interface StageOption { DealStageId: number; StageName: string; Probability: number; }

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (d: any): Deal => ({
  id: String(d.DealId),
  dealNumber: d.DealNumber || "",
  dealName: d.DealName || "",
  dealStageId: String(d.DealStageId || ""),
  stageName: d.StageName || "",
  stageProbability: d.StageProbability || 0,
  closingDate: d.ClosingDate || "",
  accountId: String(d.AccountId || ""),
  accountName: d.AccountName || "",
  contactId: String(d.ContactId || ""),
  contactFirstName: d.ContactFirstName || "",
  contactLastName: d.ContactLastName || "",
  amount: d.Amount || 0,
  probability: d.Probability || 0,
  dealType: d.DealType || "",
  leadSource: d.LeadSource || "",
  expectedRevenue: d.ExpectedRevenue || 0,
  description: d.Description || "",
  assignedToUserId: String(d.AssignedToUserId || ""),
  assignedToName: d.AssignedToName || "",
  creatorName: d.CreatorName || "",
  createdAt: d.CreatedAt || "",
});

const emptyForm: DealFormData = {
  dealName: "", dealStageId: "", closingDate: "",
  accountId: "", contactId: "", amount: "",
  probability: "", dealType: "", leadSource: "",
  description: "", assignedToUserId: "",
};

const FormFields = ({
  data, onChange, accounts, contacts, users, stages,
  readOnly = false, isFetching = false,
}: {
  data: DealFormData;
  onChange: (data: DealFormData) => void;
  accounts: AccountOption[];
  contacts: ContactOption[];
  users: UserOption[];
  stages: StageOption[];
  readOnly?: boolean;
  isFetching?: boolean;
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching deal details...</p>
      </div>
    );
  }

  const handleStageChange = (stageId: string) => {
    const stage = stages.find(s => String(s.DealStageId) === stageId);
    onChange({
      ...data,
      dealStageId: stageId,
      probability: stage ? String(stage.Probability) : data.probability
    });
  };

  return (
    <div className="grid gap-6 py-2">
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Deal Information</h3>
        <div className="space-y-2">
          <Label>Deal Name *</Label>
          <Input value={data.dealName} onChange={(e) => onChange({ ...data, dealName: e.target.value })} placeholder="Acme Software Deal" disabled={readOnly} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Stage *</Label>
            <Select value={data.dealStageId} onValueChange={handleStageChange} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {stages.map(s => <SelectItem key={s.DealStageId} value={String(s.DealStageId)}>{s.StageName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Closing Date *</Label>
            <Input type="date" value={data.closingDate ? data.closingDate.split('T')[0] : ""} onChange={(e) => onChange({ ...data, closingDate: e.target.value })} disabled={readOnly} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" value={data.amount} onChange={(e) => onChange({ ...data, amount: e.target.value })} placeholder="10000" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Probability (%)</Label>
            <Input type="number" value={data.probability} onChange={(e) => onChange({ ...data, probability: e.target.value })} placeholder="50" disabled={readOnly} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Relations & Assignment</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Account *</Label>
            <Select value={data.accountId} onValueChange={(v) => onChange({ ...data, accountId: v })} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map(acc => <SelectItem key={acc.AccountId} value={String(acc.AccountId)}>{acc.AccountName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Contact</Label>
            <Select value={data.contactId} onValueChange={(v) => onChange({ ...data, contactId: v })} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
              <SelectContent>
                {contacts.map(c => <SelectItem key={c.ContactId} value={String(c.ContactId)}>{c.FirstName} {c.LastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Select value={data.assignedToUserId} onValueChange={(v) => onChange({ ...data, assignedToUserId: v })} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Assign to user" /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.UserId} value={String(u.UserId)}>{u.Name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deal Type</Label>
            <Select value={data.dealType} onValueChange={(v) => onChange({ ...data, dealType: v })} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="New / Existing" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="New Business">New Business</SelectItem>
                <SelectItem value="Existing Business">Existing Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="Deal details..." disabled={readOnly} />
      </div>
    </div>
  );
};

const toLocalDatetimeValue = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
};

const ProposalFormFields = ({ data, onChange, readOnly = false }: { data: any, onChange: (data: any) => void, readOnly?: boolean }) => (
  <div className="space-y-4 py-2">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Proposal Title *</Label>
        <Input
          value={data.ProposalTitle || ""}
          onChange={(e) => onChange({ ...data, ProposalTitle: e.target.value })}
          placeholder="Enter proposal title"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label>Deal ID</Label>
        <Input value={data.DealId || ""} disabled className="bg-muted" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Amount *</Label>
        <Input
          type="number"
          value={data.ProposalAmount || ""}
          onChange={(e) => onChange({ ...data, ProposalAmount: e.target.value })}
          placeholder="0.00"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label>Currency *</Label>
        <Select value={data.Currency || "INR"} onValueChange={(v) => onChange({ ...data, Currency: v })} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
          <SelectContent>
            {["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "CNY"].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Validity Date</Label>
        <Input
          type="date"
          value={data.ValidityDate || ""}
          onChange={(e) => onChange({ ...data, ValidityDate: e.target.value })}
          disabled={readOnly}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Payment Terms</Label>
        <Input
          value={data.PaymentTerms || ""}
          onChange={(e) => onChange({ ...data, PaymentTerms: e.target.value })}
          placeholder="e.g., Net 30"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label>Delivery Terms</Label>
        <Input
          value={data.DeliveryTerms || ""}
          onChange={(e) => onChange({ ...data, DeliveryTerms: e.target.value })}
          placeholder="e.g., 6 weeks"
          disabled={readOnly}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Internal Notes</Label>
      <Textarea
        value={data.InternalNotes || ""}
        onChange={(e) => onChange({ ...data, InternalNotes: e.target.value })}
        placeholder="Enter internal notes"
        disabled={readOnly}
        rows={3}
      />
    </div>
  </div>
);

const AppointmentFormFields = ({ data, onChange, readOnly = false, statuses = [] }: { data: any, onChange: (data: any) => void, readOnly?: boolean, statuses: any[] }) => (
  <div className="grid gap-6 py-2">
    <div className="space-y-4">
      <h3 className="text-sm font-medium border-b pb-2">Appointment Details</h3>
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          value={data.Title}
          onChange={(e) => onChange({ ...data, Title: e.target.value })}
          placeholder="e.g. Product Demo Call"
          disabled={readOnly}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mode *</Label>
          <Select value={data.Mode} onValueChange={(v: any) => onChange({ ...data, Mode: v })} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Offline">Offline</SelectItem>
              <SelectItem value="Phone">Phone</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            value={data.Duration}
            onChange={(e) => onChange({ ...data, Duration: e.target.value })}
            placeholder="60"
            disabled={readOnly}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date & Time *</Label>
          <Input
            type="datetime-local"
            value={data.StartDateTime}
            onChange={(e) => onChange({ ...data, StartDateTime: e.target.value })}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date & Time</Label>
          <Input
            type="datetime-local"
            value={data.EndDateTime}
            onChange={(e) => onChange({ ...data, EndDateTime: e.target.value })}
            disabled={readOnly}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={data.Location} onChange={(e) => onChange({ ...data, Location: e.target.value })} placeholder="Office / Zoom / etc." disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>Meeting Link</Label>
          <Input value={data.MeetingLink} onChange={(e) => onChange({ ...data, MeetingLink: e.target.value })} placeholder="https://meet.google.com/..." disabled={readOnly} />
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-sm font-medium border-b pb-2">Link To</h3>
      <div className="space-y-2">
        <Label>Deal ID</Label>
        <Input value={data.DealId || ""} disabled className="bg-muted" />
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-sm font-medium border-b pb-2">Notes</h3>
      <div className="space-y-2">
        <Label>Agenda</Label>
        <Textarea value={data.Agenda} onChange={(e) => onChange({ ...data, Agenda: e.target.value })} placeholder="What will be discussed?" disabled={readOnly} rows={2} />
      </div>
    </div>
  </div>
);

interface PaginationData {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState<DealFormData>(emptyForm);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1, totalItems: 0, totalPages: 1, itemsPerPage: 10,
    hasNextPage: false, hasPrevPage: false
  });

  // Action states
  const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false);
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);
  const [proposalFormData, setProposalFormData] = useState<any>({});
  const [appointmentFormData, setAppointmentFormData] = useState<any>({});
  const [appointmentStatuses, setAppointmentStatuses] = useState<any[]>([]);

  // Selection state
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("globalDealSelection");
    if (saved) {
      try { setSelectedDealIds(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const updateSelection = (ids: string[]) => {
    setSelectedDealIds(ids);
    if (ids.length > 0) {
      localStorage.setItem("globalDealSelection", JSON.stringify(ids));
    } else {
      localStorage.removeItem("globalDealSelection");
    }
  };

  const handleSelectDeal = (id: string, checked: boolean) => {
    const newIds = checked ? [...selectedDealIds, id] : selectedDealIds.filter(i => i !== id);
    updateSelection(newIds);
  };

  const handleSelectAll = (checked: boolean) => {
    const newIds = checked ? deals.map(d => d.id) : [];
    updateSelection(newIds);
  };

  const clearSelection = () => updateSelection([]);

  const fetchDeals = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.itemsPerPage)
      });
      if (searchQuery) params.append("search", searchQuery);
      if (stageFilter !== "all") params.append("DealStageId", stageFilter);

      const res = await fetch(`${BACKEND_BASE_URL}/api/deals?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch deals");
      const result = await res.json();
      setDeals(Array.isArray(result.data) ? result.data.map(mapBackendToFrontend) : []);
      if (result.pagination) {
        setPagination({
          currentPage: result.pagination.currentPage || page,
          totalItems: result.pagination.totalItems || 0,
          totalPages: result.pagination.totalPages || 1,
          itemsPerPage: result.pagination.itemsPerPage || pagination.itemsPerPage,
          hasNextPage: result.pagination.hasNextPage || false,
          hasPrevPage: result.pagination.hasPrevPage || false
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, stageFilter, pagination.itemsPerPage, toast]);

  const fetchOptions = async () => {
    try {
      const [accRes, conRes, userRes, stageRes, aptStatusRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/accounts?limit=1000`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/contacts?limit=1000`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/users`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/deals/stages`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/lookups/appointment-statuses`, { headers: getAuthHeaders() }),
      ]);
      if (accRes.ok) setAccounts((await accRes.json()).data || []);
      if (conRes.ok) setContacts((await conRes.json()).data || []);
      if (userRes.ok) setUsers((await userRes.json()).data || []);
      if (stageRes.ok) setStages((await stageRes.json()).data || []);
      if (aptStatusRes.ok) setAppointmentStatuses((await aptStatusRes.json()).data || []);
    } catch (err) {
      console.error("Failed to fetch options", err);
    }
  };

  useEffect(() => { fetchDeals(1); }, [searchQuery, stageFilter]);
  useEffect(() => { fetchOptions(); }, []);

  const fetchDealDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/deals/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch deal details");
      const result = await res.json();
      const d = result.data;
      setFormData({
        dealName: d.DealName || "",
        dealStageId: String(d.DealStageId || ""),
        closingDate: d.ClosingDate || "",
        accountId: String(d.AccountId || ""),
        contactId: String(d.ContactId || ""),
        amount: String(d.Amount || ""),
        probability: String(d.Probability || ""),
        dealType: d.DealType || "",
        leadSource: d.LeadSource || "",
        description: d.Description || "",
        assignedToUserId: String(d.AssignedToUserId || ""),
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleSave = async (mode: 'create' | 'edit') => {
    if (!formData.dealName || !formData.dealStageId || !formData.closingDate || !formData.accountId) {
      toast({ title: "Validation Error", description: "Name, Stage, Closing Date, and Account are required", variant: "destructive" });
      return;
    }
    try {
      const url = mode === 'create' ? `${BACKEND_BASE_URL}/api/deals` : `${BACKEND_BASE_URL}/api/deals/${selectedDeal?.id}`;
      const res = await fetch(url, {
        method: mode === 'create' ? "POST" : "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          DealName: formData.dealName,
          DealStageId: parseInt(formData.dealStageId),
          ClosingDate: formData.closingDate,
          AccountId: formData.accountId ? parseInt(formData.accountId) : null,
          ContactId: formData.contactId ? parseInt(formData.contactId) : null,
          Amount: formData.amount ? parseFloat(formData.amount) : null,
          Probability: formData.probability ? parseInt(formData.probability) : null,
          DealType: formData.dealType || null,
          LeadSource: formData.leadSource || null,
          Description: formData.description || null,
          AssignedToUserId: formData.assignedToUserId ? parseInt(formData.assignedToUserId) : null,
        }),
      });
      if (!res.ok) throw new Error(`Failed to ${mode} deal`);
      toast({ title: "Success", description: `Deal ${mode === 'create' ? 'created' : 'updated'} successfully.` });
      fetchDeals(pagination.currentPage);
      mode === 'create' ? setIsCreateOpen(false) : setIsEditOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedDeal) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/deals/${selectedDeal.id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete deal");
      toast({ title: "Success", description: "Deal deleted successfully." });
      fetchDeals(pagination.currentPage);
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateStage = async (dealId: string, newStageId: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/deals/${dealId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ DealStageId: parseInt(newStageId) }),
      });
      if (!res.ok) throw new Error("Failed to update deal stage");
      toast({ title: "Success", description: "Deal stage updated successfully." });
      fetchDeals(pagination.currentPage);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateProposal = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/proposals`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...proposalFormData,
          ProposalAmount: parseFloat(proposalFormData.ProposalAmount || "0"),
          DealId: parseInt(proposalFormData.DealId)
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create proposal");
      }
      toast({ title: "Success", description: "Proposal created successfully" });
      setIsCreateProposalOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const payload = {
        ...appointmentFormData,
        DealId: parseInt(appointmentFormData.DealId),
        Duration: parseInt(appointmentFormData.Duration || "60"),
        AppointmentStatusId: parseInt(appointmentFormData.AppointmentStatusId || "1"),
      };
      const res = await fetch(`${BACKEND_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create appointment");
      }
      toast({ title: "Success", description: "Appointment scheduled successfully" });
      setIsCreateAppointmentOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openCreateProposal = (deal: Deal) => {
    setProposalFormData({
      ProposalTitle: `Proposal for ${deal.dealName}`,
      DealId: deal.id,
      ProposalAmount: String(deal.amount || ""),
      Currency: "INR",
      ValidityDate: "",
      PaymentTerms: "",
      DeliveryTerms: "",
      InternalNotes: ""
    });
    setIsCreateProposalOpen(true);
  };

  const openCreateAppointment = (deal: Deal) => {
    setAppointmentFormData({
      Title: `Meeting for ${deal.dealName}`,
      DealId: deal.id,
      Agenda: "",
      MeetingNotes: "",
      StartDateTime: "",
      EndDateTime: "",
      Duration: "60",
      Mode: "Online",
      Location: "",
      MeetingLink: "",
      AppointmentStatusId: "1",
    });
    setIsCreateAppointmentOpen(true);
  };

  const openView = async (d: Deal) => { setSelectedDeal(d); setIsViewOpen(true); await fetchDealDetail(d.id); };
  const openEdit = async (d: Deal) => { setSelectedDeal(d); setIsEditOpen(true); await fetchDealDetail(d.id); };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Deals</h1>
            <p className="text-muted-foreground">Manage your sales pipeline and revenue opportunities</p>
          </div>
          <Button className="gap-2 gradient-primary text-primary-foreground shadow-glow" onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4" />
            Add Deal
          </Button>
        </div>

        <div className="card-elevated p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search deals..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages.map(s => <SelectItem key={s.DealStageId} value={String(s.DealStageId)}>{s.StageName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => fetchDeals(pagination.currentPage)}>
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            {selectedDealIds.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-xs font-medium text-primary">{selectedDealIds.length} Selected</span>
                <button onClick={clearSelection} className="hover:text-primary transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-elevated overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading deals...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-10">
                      <Checkbox
                        checked={deals.length > 0 && selectedDealIds.length === deals.length}
                        onCheckedChange={(c) => handleSelectAll(!!c)}
                      />
                    </th>
                    <th>Deal Name</th>
                    <th>Account</th>
                    <th>Stage</th>
                    <th>Amount</th>
                    <th>Closing Date</th>
                    <th>Assigned To</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No deals found.</td></tr>
                  ) : (
                    deals.map((deal) => (
                      <tr key={deal.id} className={selectedDealIds.includes(deal.id) ? "bg-primary/5" : ""}>
                        <td>
                          <Checkbox
                            checked={selectedDealIds.includes(deal.id)}
                            onCheckedChange={(c) => handleSelectDeal(deal.id, !!c)}
                          />
                        </td>
                        <td>
                          <div>
                            <p className="font-medium">{deal.dealName}</p>
                            <p className="text-xs text-muted-foreground">{deal.dealNumber}</p>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{deal.accountName || "—"}</span>
                          </div>
                        </td>
                        <td>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors">
                                {deal.stageName}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {stages.map((s) => (
                                <DropdownMenuItem
                                  key={s.DealStageId}
                                  className={deal.dealStageId === String(s.DealStageId) ? "bg-accent font-medium" : ""}
                                  onClick={() => handleUpdateStage(deal.id, String(s.DealStageId))}
                                >
                                  {s.StageName}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 font-medium">
                            ₹{deal.amount.toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {deal.closingDate ? format(new Date(deal.closingDate), 'MMM dd, yyyy') : "—"}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {deal.assignedToName || "Unassigned"}
                          </div>
                        </td>
                        <td className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(deal)}><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(deal)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {[3, 4, 5].includes(parseInt(deal.dealStageId)) && (
                                <DropdownMenuItem onClick={() => openCreateProposal(deal)}><FilePlus className="w-4 h-4 mr-2 text-primary" />Create Proposal</DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openCreateAppointment(deal)}><CalendarPlus className="w-4 h-4 mr-2 text-primary" />Create Appointment</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedDeal(deal); setIsDeleteOpen(true); }}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {deals.length} of {pagination.totalItems} deals</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrevPage} onClick={() => fetchDeals(pagination.currentPage - 1)}>Previous</Button>
              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-medium">{pagination.currentPage}</span>
                <span className="text-sm text-muted-foreground">of {pagination.totalPages}</span>
              </div>
              <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={() => fetchDeals(pagination.currentPage + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>

      <CrudDialog title="Add New Deal" open={isCreateOpen} onOpenChange={setIsCreateOpen} onSave={() => handleSave('create')}>
        <FormFields data={formData} onChange={setFormData} accounts={accounts} contacts={contacts} users={users} stages={stages} />
      </CrudDialog>

      <CrudDialog title={`Edit Deal: ${selectedDeal?.dealName}`} open={isEditOpen} onOpenChange={setIsEditOpen} mode="edit" onSave={() => handleSave('edit')}>
        <FormFields data={formData} onChange={setFormData} accounts={accounts} contacts={contacts} users={users} stages={stages} isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog title="Deal Details" open={isViewOpen} onOpenChange={setIsViewOpen} mode="view">
        <FormFields data={formData} onChange={() => { }} accounts={accounts} contacts={contacts} users={users} stages={stages} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={handleDelete} title="Delete Deal" description={`Are you sure you want to delete ${selectedDeal?.dealName}?`} />

      <CrudDialog title="Create Proposal" open={isCreateProposalOpen} onOpenChange={setIsCreateProposalOpen} onSave={handleCreateProposal}>
        <ProposalFormFields data={proposalFormData} onChange={setProposalFormData} />
      </CrudDialog>

      <CrudDialog title="Schedule Appointment" open={isCreateAppointmentOpen} onOpenChange={setIsCreateAppointmentOpen} onSave={handleCreateAppointment}>
        <AppointmentFormFields data={appointmentFormData} onChange={setAppointmentFormData} statuses={appointmentStatuses} />
      </CrudDialog>
    </AppLayout>
  );
}
