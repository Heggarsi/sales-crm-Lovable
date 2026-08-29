import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2,
  Loader2, Clock, MapPin, Link2, Users, Briefcase, X,
  ChevronRight, CalendarCheck, CalendarX, CalendarClock, CalendarRange
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  AppointmentId: number;
  AppointmentNumber: string;
  Title: string;
  LeadId: number | null;
  LeadFirstName?: string;
  LeadLastName?: string;
  LeadNumber?: string;
  LeadCompanyName?: string;
  // Core
  Agenda?: string;
  MeetingNotes?: string;
  // Timing
  StartDateTime: string;
  EndDateTime?: string;
  Duration?: number;
  // Meeting info
  Mode: "Online" | "Offline" | "Phone";
  Location?: string;
  MeetingLink?: string;
  // Tracking
  Outcome?: string;
  AppointmentStatusId: number;
  AppointmentStatusName?: string;
  NextFollowUpDate?: string;
  FollowUpNotes?: string;
  // Participants
  AttendeesList?: any;
  // Reminders
  ReminderEnabled?: boolean;
  ReminderMinutesBefore?: number;
  // Audit
  CreatedByUserId?: number;
  CreatedByName?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

interface AppointmentFormData {
  Title: string;
  LeadId: string;
  Agenda: string;
  MeetingNotes: string;
  StartDateTime: string;
  EndDateTime: string;
  Duration: string;
  Mode: "Online" | "Offline" | "Phone";
  Location: string;
  MeetingLink: string;
  Outcome: string;
  AppointmentStatusId: string;
  NextFollowUpDate: string;
  FollowUpNotes: string;
  AttendeesList: string;
  ReminderEnabled: boolean;
  ReminderMinutesBefore: string;
}

interface RelationOption { id: number; label: string; }

interface PaginationData {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const toLocalDatetimeValue = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case "Scheduled": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Completed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Cancelled": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case "Rescheduled": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default: return "bg-secondary text-secondary-foreground";
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case "Scheduled": return <Calendar className="w-4 h-4" />;
    case "Completed": return <CalendarCheck className="w-4 h-4" />;
    case "Cancelled": return <CalendarX className="w-4 h-4" />;
    case "Rescheduled": return <CalendarClock className="w-4 h-4" />;
    default: return <CalendarRange className="w-4 h-4" />;
  }
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const formatAttendeesForDisplay = (raw: any): string => {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.join(", ");
  return JSON.stringify(raw);
};

const emptyForm: AppointmentFormData = {
  Title: "", LeadId: "",
  Agenda: "", MeetingNotes: "", StartDateTime: "", EndDateTime: "",
  Duration: "60", Mode: "Online", Location: "", MeetingLink: "",
  Outcome: "", AppointmentStatusId: "1", NextFollowUpDate: "",
  FollowUpNotes: "", AttendeesList: "", ReminderEnabled: false,
  ReminderMinutesBefore: "",
};

const mapAppointmentToForm = (a: Appointment): AppointmentFormData => ({
  Title: a.Title || "",
  LeadId: a.LeadId?.toString() || "",
  Agenda: a.Agenda || "",
  MeetingNotes: a.MeetingNotes || "",
  StartDateTime: toLocalDatetimeValue(a.StartDateTime),
  EndDateTime: toLocalDatetimeValue(a.EndDateTime),
  Duration: a.Duration?.toString() || "",
  Mode: a.Mode || "Online",
  Location: a.Location || "",
  MeetingLink: a.MeetingLink || "",
  Outcome: a.Outcome || "",
  AppointmentStatusId: a.AppointmentStatusId?.toString() || "1",
  NextFollowUpDate: toLocalDatetimeValue(a.NextFollowUpDate),
  FollowUpNotes: a.FollowUpNotes || "",
  AttendeesList: formatAttendeesForDisplay(a.AttendeesList),
  ReminderEnabled: a.ReminderEnabled || false,
  ReminderMinutesBefore: a.ReminderMinutesBefore?.toString() || "",
});

// ─── Form Fields ──────────────────────────────────────────────────────────────

const FormFields = ({
  data,
  onChange,
  leads,
  statuses,
  readOnly = false,
  isFetching = false,
  showStatusField = false,
  disableLeadSelect = false,
}: {
  data: AppointmentFormData;
  onChange: (d: AppointmentFormData) => void;
  leads: RelationOption[];
  statuses: any[];
  readOnly?: boolean;
  isFetching?: boolean;
  showStatusField?: boolean;
  disableLeadSelect?: boolean;
}) => {
  const getStatusName = (statusId: string): string => {
    const status = statuses.find(
      (s) => String(s.AppointmentStatusId) === String(statusId)
    );
    return status?.StatusName || status?.AppointmentStatusName || statusId;
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching appointment details...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 py-2">

      {/* ── Core Details ── */}
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
            {readOnly ? (
              <Input value={data.Mode} readOnly className="bg-muted" />
            ) : (
              <Select value={data.Mode} onValueChange={(v: any) => onChange({ ...data, Mode: v })}>
                <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={data.Duration}
              onChange={(e) => onChange({ ...data, Duration: e.target.value })}
              placeholder="60"
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
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
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date & Time</Label>
            <Input
              type="datetime-local"
              value={data.EndDateTime}
              onChange={(e) => onChange({ ...data, EndDateTime: e.target.value })}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={data.Location}
              onChange={(e) => onChange({ ...data, Location: e.target.value })}
              placeholder="Office / Zoom / etc."
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Meeting Link</Label>
            <Input
              value={data.MeetingLink}
              onChange={(e) => onChange({ ...data, MeetingLink: e.target.value })}
              placeholder="https://meet.google.com/..."
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
        </div>
      </div>

      {/* ── Lead (mandatory relation) ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Link To</h3>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Lead <span className="text-destructive ml-0.5">*</span>
          </Label>
          {readOnly || disableLeadSelect ? (
            <Input
              value={leads.find(l => String(l.id) === String(data.LeadId))?.label || (data.LeadId ? `Lead #${data.LeadId}` : "—")}
              disabled
              className="bg-muted"
            />
          ) : (
            <Select
              value={data.LeadId || ""}
              onValueChange={(v) => onChange({ ...data, LeadId: v })}
            >
              <SelectTrigger
                className={!data.LeadId ? "border-destructive/50 focus:ring-destructive/30" : ""}
              >
                <SelectValue placeholder="Select a lead *" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── Notes & Agenda ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Notes</h3>
        <div className="space-y-2">
          <Label>Agenda</Label>
          <Textarea
            value={data.Agenda}
            onChange={(e) => onChange({ ...data, Agenda: e.target.value })}
            placeholder="What will be discussed?"
            disabled={readOnly}
            className={readOnly ? "bg-muted" : ""}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Meeting Notes</Label>
          <Textarea
            value={data.MeetingNotes}
            onChange={(e) => onChange({ ...data, MeetingNotes: e.target.value })}
            placeholder="Notes taken during or after the meeting"
            disabled={readOnly}
            className={readOnly ? "bg-muted" : ""}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Attendees</Label>
          <Input
            value={data.AttendeesList}
            onChange={(e) => onChange({ ...data, AttendeesList: e.target.value })}
            placeholder="John Doe, Jane Smith..."
            disabled={readOnly}
            className={readOnly ? "bg-muted" : ""}
          />
        </div>
      </div>

      {/* ── Tracking / Follow-up ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Tracking & Follow-up</h3>
        <div className="grid grid-cols-2 gap-4">
          {(showStatusField || readOnly) && (
            <div className="space-y-2">
              <Label>Status</Label>
              {readOnly ? (
                <Input
                  value={getStatusName(data.AppointmentStatusId)}
                  readOnly
                  className="bg-muted"
                />
              ) : (
                <Select
                  value={data.AppointmentStatusId}
                  onValueChange={(v) => onChange({ ...data, AppointmentStatusId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.AppointmentStatusId} value={String(s.AppointmentStatusId)}>
                        {s.StatusName || s.AppointmentStatusName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label>Outcome</Label>
            <Input
              value={data.Outcome}
              onChange={(e) => onChange({ ...data, Outcome: e.target.value })}
              placeholder="e.g. Interested, Follow-up needed"
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Next Follow-up Date</Label>
            <Input
              type="datetime-local"
              value={data.NextFollowUpDate}
              onChange={(e) => onChange({ ...data, NextFollowUpDate: e.target.value })}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Follow-up Notes</Label>
            <Input
              value={data.FollowUpNotes}
              onChange={(e) => onChange({ ...data, FollowUpNotes: e.target.value })}
              placeholder="What to do next?"
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
        </div>
      </div>

      {/* ── Reminders ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Reminder</h3>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="reminderEnabled"
            checked={data.ReminderEnabled}
            onChange={(e) => onChange({ ...data, ReminderEnabled: e.target.checked })}
            disabled={readOnly}
            className="w-4 h-4 accent-primary"
          />
          <Label htmlFor="reminderEnabled" className="cursor-pointer">Enable reminder</Label>
        </div>
        {data.ReminderEnabled && (
          <div className="space-y-2">
            <Label>Remind me (minutes before)</Label>
            <Input
              type="number"
              value={data.ReminderMinutesBefore}
              onChange={(e) => onChange({ ...data, ReminderMinutesBefore: e.target.value })}
              placeholder="e.g. 30"
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>
        )}
      </div>

    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [leads, setLeads] = useState<RelationOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>(emptyForm);

  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1, totalItems: 0, totalPages: 1,
    itemsPerPage: 10, hasNextPage: false, hasPrevPage: false,
  });

  const { toast } = useToast();

  // ── Fetch Appointments ──────────────────────────────────────────────────
  const fetchAppointments = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.itemsPerPage),
        requireLeadId: "true",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await fetch(`${BACKEND_BASE_URL}/api/appointments?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch appointments");

      const result = await res.json();
      const list = result.data?.appointments || result.data || result.appointments || [];
      setAppointments(Array.isArray(list) ? list : []);

      if (result.pagination) {
        setPagination({
          currentPage: result.pagination.currentPage || page,
          totalItems: result.pagination.totalItems || 0,
          totalPages: result.pagination.totalPages || 1,
          itemsPerPage: result.pagination.itemsPerPage || pagination.itemsPerPage,
          hasNextPage: result.pagination.hasNextPage || false,
          hasPrevPage: result.pagination.hasPrevPage || false,
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, pagination.itemsPerPage, toast]);

  // ── Fetch Dropdowns ─────────────────────────────────────────────────────
  const fetchDropdownOptions = useCallback(async () => {
    try {
      const [leadsRes, statusesRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/leads?limit=1000`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/lookups/appointment-statuses`, { headers: getAuthHeaders() }),
      ]);

      if (leadsRes.ok) {
        const d = await leadsRes.json();
        const list = d.data?.leads || d.data || d.leads || [];
        setLeads(list.map((lead: any) => ({
          id: lead.LeadId,
          label: `${lead.FirstName} ${lead.LastName}` + (lead.LeadNumber ? ` (${lead.LeadNumber})` : ""),
        })));
      }

      if (statusesRes.ok) {
        const d = await statusesRes.json();
        setStatuses(d.data || d || []);
      }
    } catch (err) {
      console.error("Failed to fetch dropdown options", err);
    }
  }, []);

  useEffect(() => {
    fetchDropdownOptions();
  }, [fetchDropdownOptions]);

  useEffect(() => {
    fetchAppointments(1);
  }, [searchQuery, pagination.itemsPerPage]);

  // ── Fetch Single Appointment Detail ────────────────────────────────────
  const fetchAppointmentDetail = async (id: number) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/appointments/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch appointment details");
      const result = await res.json();
      const a: Appointment = result.data || result;
      setFormData(mapAppointmentToForm(a));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  // ── CRUD Handlers ───────────────────────────────────────────────────────
  const buildPayload = (d: AppointmentFormData) => ({
    Title: d.Title,
    LeadId: d.LeadId ? parseInt(d.LeadId) : null,
    Agenda: d.Agenda || null,
    MeetingNotes: d.MeetingNotes || null,
    StartDateTime: d.StartDateTime || null,
    EndDateTime: d.EndDateTime || null,
    Duration: d.Duration ? parseInt(d.Duration) : null,
    Mode: d.Mode,
    Location: d.Location || null,
    MeetingLink: d.MeetingLink || null,
    Outcome: d.Outcome || null,
    AppointmentStatusId: d.AppointmentStatusId ? parseInt(d.AppointmentStatusId) : 1,
    NextFollowUpDate: d.NextFollowUpDate || null,
    FollowUpNotes: d.FollowUpNotes || null,
    AttendeesList: d.AttendeesList || null,
    ReminderEnabled: d.ReminderEnabled,
    ReminderMinutesBefore: d.ReminderMinutesBefore ? parseInt(d.ReminderMinutesBefore) : null,
  });

  const handleCreate = async () => {
    if (!formData.Title || !formData.StartDateTime) {
      toast({ title: "Validation Error", description: "Title and Start Date/Time are required.", variant: "destructive" });
      return;
    }
    if (!formData.LeadId) {
      toast({ title: "Validation Error", description: "A Lead must be selected.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(buildPayload(formData)),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create appointment");
      }
      toast({ title: "Success", description: "Appointment scheduled successfully." });
      fetchAppointments(pagination.currentPage);
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    if (!formData.LeadId) {
      toast({ title: "Validation Error", description: "A Lead must be selected.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/appointments/${selectedItem.AppointmentId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(buildPayload(formData)),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update appointment");
      }
      toast({ title: "Success", description: "Appointment updated successfully." });
      fetchAppointments(pagination.currentPage);
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/appointments/${selectedItem.AppointmentId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete appointment");
      toast({ title: "Success", description: "Appointment deleted successfully." });
      fetchAppointments(pagination.currentPage);
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // ── Dialog Openers ──────────────────────────────────────────────────────
  const openCreate = () => { setFormData(emptyForm); setIsCreateOpen(true); };

  const openView = async (item: Appointment) => {
    setSelectedItem(item);
    setIsViewOpen(true);
    await fetchAppointmentDetail(item.AppointmentId);
  };

  const openEdit = async (item: Appointment) => {
    setSelectedItem(item);
    setIsEditOpen(true);
    await fetchAppointmentDetail(item.AppointmentId);
  };

  const openDelete = (item: Appointment) => { setSelectedItem(item); setIsDeleteOpen(true); };

  // ── Pagination ──────────────────────────────────────────────────────────
  const goToPreviousPage = () => {
    if (pagination.hasPrevPage) fetchAppointments(pagination.currentPage - 1);
  };
  const goToNextPage = () => {
    if (pagination.hasNextPage) fetchAppointments(pagination.currentPage + 1);
  };

  const statCounts = ["Scheduled", "Completed", "Cancelled", "Rescheduled"].map((s) => ({
    label: s,
    count: appointments.filter((a) => a.AppointmentStatusName === s).length,
  }));

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Calendar className="w-7 h-7 text-primary" />
              Lead Appointments
            </h1>
            <p className="text-muted-foreground">Manage your lead meetings and schedules</p>
          </div>
          <Button className="gap-2 gradient-primary text-primary-foreground shadow-glow" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Schedule Lead Appointment
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCounts.map(({ label, count }) => (
            <Card key={label} className="card-elevated group hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getStatusIcon(label)}
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${label === "Completed" ? "text-emerald-500" :
                  label === "Cancelled" ? "text-rose-500" :
                    label === "Rescheduled" ? "text-amber-500" : "text-primary"
                  }`}>{count}</div>
                <p className="text-xs text-muted-foreground">appointments</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Search / Filter bar ── */}
        <div className="card-elevated p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or lead..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => fetchAppointments(pagination.currentPage)}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── List ── */}
        <div className="card-elevated overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading appointments...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No appointments found.</p>
              <Button variant="link" onClick={openCreate}>Schedule your first lead meeting</Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {appointments.map((apt) => (
                <div key={apt.AppointmentId} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">

                    {/* Left */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base truncate">{apt.Title}</h3>
                        <Badge variant="outline" className="text-[10px] shrink-0">{apt.Mode}</Badge>
                        <Badge variant="outline" className="text-[10px] bg-muted shrink-0">{apt.AppointmentNumber}</Badge>
                      </div>

                      {/* Timing row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateTime(apt.StartDateTime)}
                        </span>
                        {apt.EndDateTime && (
                          <span className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            {formatDateTime(apt.EndDateTime)}
                          </span>
                        )}
                        {apt.Duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {apt.Duration} min
                          </span>
                        )}
                        {apt.Location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {apt.Location}
                          </span>
                        )}
                        {apt.MeetingLink && (
                          <a
                            href={apt.MeetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            Join
                          </a>
                        )}
                      </div>

                      {/* Lead row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                        {(apt.LeadFirstName || apt.LeadLastName) && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 rounded-md text-primary font-medium">
                            <Users className="w-3 h-3" />
                            {apt.LeadFirstName} {apt.LeadLastName}{apt.LeadNumber ? ` (${apt.LeadNumber})` : ""}
                          </div>
                        )}
                        {apt.LeadCompanyName && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/10 rounded-md text-secondary-foreground font-medium">
                            <Briefcase className="w-3 h-3" />
                            {apt.LeadCompanyName}
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      {apt.CreatedByName && (
                        <div className="text-xs text-muted-foreground">
                          Created by {apt.CreatedByName}
                          {apt.CreatedAt && ` · ${new Date(apt.CreatedAt).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={`px-3 py-1 border-none flex items-center gap-1 ${getStatusColor(apt.AppointmentStatusName)}`}
                      >
                        {getStatusIcon(apt.AppointmentStatusName)}
                        {apt.AppointmentStatusName}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openView(apt)}>
                            <Eye className="w-4 h-4 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(apt)}>
                            <Edit className="w-4 h-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => openDelete(apt)}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {appointments.length} of {pagination.totalItems} appointments
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrevPage} onClick={goToPreviousPage}>
                Previous
              </Button>
              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-medium">{pagination.currentPage}</span>
                <span className="text-sm text-muted-foreground">of {pagination.totalPages}</span>
              </div>
              <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={goToNextPage}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Dialog ── */}
      <CrudDialog
        title="Schedule Lead Appointment"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={handleCreate}
        saveLabel="Schedule"
      >
        <FormFields
          data={formData} onChange={setFormData}
          leads={leads} statuses={statuses}
        />
      </CrudDialog>

      {/* ── View Dialog ── */}
      <CrudDialog
        title="Lead Appointment Details"
        open={isViewOpen}
        onOpenChange={() => { setIsViewOpen(false); setSelectedItem(null); setFormData(emptyForm); }}
        mode="view"
      >
        <FormFields
          data={formData} onChange={() => { }}
          leads={leads} statuses={statuses}
          readOnly isFetching={isFetchingDetail}
        />
      </CrudDialog>

      {/* ── Edit Dialog ── */}
      <CrudDialog
        title={`Edit: ${selectedItem?.Title || ""}`}
        open={isEditOpen}
        onOpenChange={() => { setIsEditOpen(false); setSelectedItem(null); setFormData(emptyForm); }}
        mode="edit"
        onSave={handleUpdate}
        saveLabel="Save Changes"
      >
        <FormFields
          data={formData} onChange={setFormData}
          leads={leads} statuses={statuses}
          showStatusField isFetching={isFetchingDetail}
        />
      </CrudDialog>

      {/* ── Delete Dialog ── */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Appointment"
        description={`Are you sure you want to delete "${selectedItem?.Title}"?`}
      />
    </AppLayout>
  );
}
