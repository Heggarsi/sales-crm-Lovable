import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Download, Loader2, TrendingUp, Calendar, Users, Repeat, ArrowUpDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface Lead {
  id: string;
  leadNumber: string;
  firstName: string;
  lastName: string;
  name: string; // derived
  email: string;
  phone: string;
  mobile: string;
  company: string;
  industry: string;
  annualRevenue: string;
  rating: string;
  designation: string;
  country: string;
  state: string;
  city: string;
  address: string;
  sourceId: string;
  sourceName: string;
  leadTypeId: string;
  leadTypeName: string;
  serviceRequiredId: string;
  serviceName: string;
  estimatedValue: string;
  remarks: string;
  statusId: string;
  statusName: string;
  assignedTo: string;
  assignedToUserId: string;
  isConverted: boolean;
  createdAt: string;
}

interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  mobile: string;
  companyName: string;
  industry: string;
  annualRevenue: string;
  rating: string;
  designation: string;
  country: string;
  state: string;
  city: string;
  address: string;
  sourceId: string;
  leadTypeId: string;
  serviceRequiredId: string;
  estimatedValue: string;
  remarks: string;
  assignedToUserId: string;
  leadStatusId?: string;
}

interface LookupItem {
  id: string;
  name: string;
}

interface PaginationData {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (l: any): Lead => ({
  id: String(l.LeadId),
  leadNumber: l.LeadNumber || "",
  firstName: l.FirstName || "",
  lastName: l.LastName || "",
  name: `${l.FirstName || ""} ${l.LastName || ""}`.trim() || l.LeadNumber,
  email: l.Email || "",
  phone: l.Phone || "",
  mobile: l.Mobile || "",
  company: l.CompanyName || "",
  industry: l.Industry || "",
  annualRevenue: l.AnnualRevenue || "",
  rating: l.Rating || "",
  designation: l.Designation || "",
  country: l.Country || "",
  state: l.State || "",
  city: l.City || "",
  address: l.Address || "",
  sourceId: l.SourceId ? String(l.SourceId) : "",
  sourceName: l.SourceName || "",
  leadTypeId: l.LeadTypeId ? String(l.LeadTypeId) : "",
  leadTypeName: l.LeadTypeName || "",
  serviceRequiredId: l.ServiceRequiredId ? String(l.ServiceRequiredId) : "",
  serviceName: l.ServiceRequiredName || "",
  estimatedValue: l.EstimatedValue != null ? String(l.EstimatedValue) : "",
  remarks: l.Remarks || "",
  statusId: l.LeadStatusId ? String(l.LeadStatusId) : "",
  statusName: l.LeadStatusName || "",
  assignedTo: l.AssignedToName || "",
  assignedToUserId: l.AssignedToUserId ? String(l.AssignedToUserId) : "",
  isConverted: !!l.IsConverted,
  createdAt: l.CreatedAt || "",
});

const emptyForm: LeadFormData = {
  firstName: "", lastName: "", email: "", phone: "", alternatePhone: "",
  mobile: "", companyName: "", industry: "", annualRevenue: "", rating: "", designation: "",
  country: "", state: "", city: "", address: "",
  sourceId: "", leadTypeId: "", assignedToUserId: "", serviceRequiredId: "", estimatedValue: "", remarks: "",
};

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

const emptyAppointmentForm: AppointmentFormData = {
  Title: "", LeadId: "",
  Agenda: "", MeetingNotes: "", StartDateTime: "", EndDateTime: "",
  Duration: "60", Mode: "Online", Location: "", MeetingLink: "",
  Outcome: "", AppointmentStatusId: "1", NextFollowUpDate: "",
  FollowUpNotes: "", AttendeesList: "", ReminderEnabled: false,
  ReminderMinutesBefore: "",
};

interface FollowUp {
  id: string;
  followUpDate: string;
  followUpTypeId: string;
  followUpTypeName: string;
  remarks: string;
  nextFollowUpDate: string;
  createdAt: string;
}

interface FollowUpFormData {
  FollowUpDate: string;
  FollowUpTypeId: string;
  Remarks: string;
  NextFollowUpDate: string;
}

const emptyFollowUpForm: FollowUpFormData = {
  FollowUpDate: "", FollowUpTypeId: "", Remarks: "", NextFollowUpDate: "",
};

const formatDateTime = (value: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const toDateTimeLocal = (value: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isUpcomingFollowUp = (followUp: FollowUp) => {
  const d = new Date(followUp.followUpDate);
  if (isNaN(d.getTime())) return true;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
};

// Appointment Form Fields component (Full Version)
const AppointmentFormFields = ({
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
  leads: { id: number; label: string }[];
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

// Follow-Up form fields component (form only)
const FollowUpFormFields = ({
  data,
  onChange,
  types,
  isFetching = false,
}: {
  data: FollowUpFormData;
  onChange: (d: FollowUpFormData) => void;
  types: LookupItem[];
  isFetching?: boolean;
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-sm">Loading follow-up types...</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Follow-Up Date *</Label>
          <Input type="datetime-local" value={data.FollowUpDate || ""} onChange={(e) => onChange({ ...data, FollowUpDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Follow-Up Type *</Label>
          <Select value={data.FollowUpTypeId || ""} onValueChange={(v) => onChange({ ...data, FollowUpTypeId: v })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Remarks</Label>
        <Textarea value={data.Remarks || ""} onChange={(e) => onChange({ ...data, Remarks: e.target.value })} placeholder="Follow-up notes" />
      </div>
      <div className="space-y-2">
        <Label>Next Follow-Up Date</Label>
        <Input type="datetime-local" value={data.NextFollowUpDate || ""} onChange={(e) => onChange({ ...data, NextFollowUpDate: e.target.value })} />
      </div>
    </div>
  );
};

// Follow-Up history list component (read only)
const FollowUpHistoryList = ({
  followUps,
  isFetching = false,
  onEdit,
  onDelete,
}: {
  followUps: FollowUp[];
  isFetching?: boolean;
  onEdit?: (f: FollowUp) => void;
  onDelete?: (f: FollowUp) => void;
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-sm">Loading follow-ups...</p>
      </div>
    );
  }
  if (followUps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No follow-ups recorded for this lead yet.</p>
    );
  }
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {followUps.map(f => {
        const upcoming = isUpcomingFollowUp(f);
        return (
          <div key={f.id} className={`p-3 rounded-lg bg-muted/50 border border-border/60 ${!upcoming ? "opacity-70" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{f.followUpTypeName || "—"}</Badge>
                {upcoming && <Badge className="border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100">Upcoming</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(f.followUpDate)}</span>
                {upcoming && (
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(f)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(f)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {f.remarks && <p className="text-sm mt-1.5 text-muted-foreground">{f.remarks}</p>}
            {f.nextFollowUpDate && (
              <p className="text-xs mt-1.5 text-primary">Next: {formatDateTime(f.nextFollowUpDate)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Form Fields component with local loading state
const FormFields = ({
  data,
  onChange,
  sources,
  types,
  salesPersons,
  services = [],
  readOnly = false,
  isCreate = false,
  isFetching = false,
  statuses = []
}: {
  data: LeadFormData;
  onChange: (data: LeadFormData) => void;
  sources: LookupItem[];
  types: LookupItem[];
  salesPersons: LookupItem[];
  services?: LookupItem[];
  readOnly?: boolean;
  isCreate?: boolean;
  isFetching?: boolean;
  statuses?: LookupItem[];
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching lead details...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={data.firstName || ""} onChange={(e) => onChange({ ...data, firstName: e.target.value })} placeholder="John" disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input value={data.lastName || ""} onChange={(e) => onChange({ ...data, lastName: e.target.value })} placeholder="Doe" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input value={data.email || ""} onChange={(e) => onChange({ ...data, email: e.target.value })} type="email" placeholder="john@acme.com" disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>Company *</Label>
          <Input value={data.companyName || ""} onChange={(e) => onChange({ ...data, companyName: e.target.value })} placeholder="Acme Inc" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone *</Label>
          <Input value={data.phone || ""} onChange={(e) => onChange({ ...data, phone: e.target.value })} placeholder="+1 (555) 000-0000" disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>Mobile</Label>
          <Input value={data.mobile || ""} onChange={(e) => onChange({ ...data, mobile: e.target.value })} placeholder="+1 (555) 000-0000" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Industry</Label>
          <Input value={data.industry || ""} onChange={(e) => onChange({ ...data, industry: e.target.value })} placeholder="IT Services" disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>Annual Revenue</Label>
          <Input value={data.annualRevenue || ""} onChange={(e) => onChange({ ...data, annualRevenue: e.target.value })} placeholder="e.g. 1000000" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rating</Label>
          <Select value={data.rating || ""} onValueChange={(v) => onChange({ ...data, rating: v })} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Designation</Label>
          <Input value={data.designation || ""} onChange={(e) => onChange({ ...data, designation: e.target.value })} placeholder="Manager" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lead Source *</Label>
          {readOnly ? (
            <Input value={sources.find(s => s.id === data.sourceId)?.name || "—"} disabled className="bg-muted" />
          ) : (
            <Select value={data.sourceId || ""} onValueChange={(v) => onChange({ ...data, sourceId: v })}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label>Lead Type *</Label>
          {readOnly ? (
            <Input value={types.find(t => t.id === data.leadTypeId)?.name || "—"} disabled className="bg-muted" />
          ) : (
            <Select value={data.leadTypeId || ""} onValueChange={(v) => onChange({ ...data, leadTypeId: v })}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Service Required</Label>
          {readOnly ? (
            <Input value={services.find(s => s.id === data.serviceRequiredId)?.name || "—"} disabled className="bg-muted" />
          ) : (
            <Select value={data.serviceRequiredId || ""} onValueChange={(v) => onChange({ ...data, serviceRequiredId: v })}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label>Estimated Value</Label>
          <Input type="number" value={data.estimatedValue || ""} onChange={(e) => onChange({ ...data, estimatedValue: e.target.value })} placeholder="0.00" disabled={readOnly} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Remarks</Label>
        <Textarea value={data.remarks || ""} onChange={(e) => onChange({ ...data, remarks: e.target.value })} placeholder="Remarks" disabled={readOnly} />
      </div>
      {!isCreate && statuses && statuses.length > 0 && (
        <div className="space-y-2">
          <Label>Lead Status</Label>
          <Select value={data.leadStatusId || ""} onValueChange={(v) => onChange({ ...data, leadStatusId: v })} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {isCreate && salesPersons.length > 0 && (
        <div className="space-y-2">
          <Label>Assign To</Label>
          <Select value={data.assignedToUserId || ""} onValueChange={(v) => onChange({ ...data, assignedToUserId: v })}>
            <SelectTrigger><SelectValue placeholder="Select sales person" /></SelectTrigger>
            <SelectContent>
              {salesPersons.map(sp => <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Country</Label>
          <Input value={data.country || ""} onChange={(e) => onChange({ ...data, country: e.target.value })} placeholder="India" disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input value={data.state || ""} onChange={(e) => onChange({ ...data, state: e.target.value })} placeholder="Karnataka" disabled={readOnly} />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={data.city || ""} onChange={(e) => onChange({ ...data, city: e.target.value })} placeholder="Bangalore" disabled={readOnly} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Textarea value={data.address || ""} onChange={(e) => onChange({ ...data, address: e.target.value })} placeholder="Full address" disabled={readOnly} />
      </div>
    </div>
  );
};

const statusStyles: Record<string, string> = {
  "New": "bg-blue-100 text-blue-700",
  "Contacted": "bg-amber-100 text-amber-700",
  "Qualified": "bg-green-100 text-green-700",
  "Unqualified": "bg-red-100 text-red-700",
  "Converted": "bg-purple-100 text-purple-700",
};

const leadTypeCircle: Record<string, string> = {
  "Hot": "bg-red-100 text-red-700",
  "Warm": "bg-amber-100 text-amber-700",
  "Cold": "bg-blue-100 text-blue-700",
};

interface ConversionData {
  createDeal: boolean;
  dealName: string;
  dealStageId: string;
  closingDate: string;
  amount: string;
}

const emptyConversion: ConversionData = {
  createDeal: false,
  dealName: "",
  dealStageId: "1",
  closingDate: new Date().toISOString().split('T')[0],
  amount: "",
};

interface LeadActionsHandlers {
  onCreateFollowUp: (l: Lead) => void;
  onOpenFollowUpHistory: (l: Lead) => void;
  onView: (l: Lead) => void;
  onEdit: (l: Lead) => void;
  onConvert: (l: Lead) => void;
  onAppointment: (l: Lead) => void;
  onDelete: (l: Lead) => void;
}

// Reusable per-lead actions dropdown (used by both desktop table and mobile cards)
const LeadActions = ({ lead, handlers }: { lead: Lead; handlers: LeadActionsHandlers }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Repeat className="w-4 h-4 mr-2" />Follow-up
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => handlers.onCreateFollowUp(lead)}>
            <Plus className="w-4 h-4 mr-2" />Create Follow-up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlers.onOpenFollowUpHistory(lead)}>
            <Repeat className="w-4 h-4 mr-2" />Follow-ups
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem onClick={() => handlers.onView(lead)}><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
      <DropdownMenuItem onClick={() => handlers.onEdit(lead)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
      {!lead.isConverted && lead.statusName === "Qualified" && (
        <DropdownMenuItem onClick={() => handlers.onConvert(lead)} className="text-purple-600 font-medium">
          <TrendingUp className="w-4 h-4 mr-2" />Convert Lead
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => handlers.onAppointment(lead)}>
        <Calendar className="w-4 h-4 mr-2" />Schedule Appointment
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive" onClick={() => handlers.onDelete(lead)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [sortValue, setSortValue] = useState<string>("created_desc");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isFollowUpHistoryOpen, setIsFollowUpHistoryOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<LeadFormData>(emptyForm);
  const [appointmentFormData, setAppointmentFormData] = useState<AppointmentFormData>(emptyAppointmentForm);
  const [appointmentStatuses, setAppointmentStatuses] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [followUpTypes, setFollowUpTypes] = useState<LookupItem[]>([]);
  const [followUpFormData, setFollowUpFormData] = useState<FollowUpFormData>(emptyFollowUpForm);
  const [followUpEditFormData, setFollowUpEditFormData] = useState<FollowUpFormData>(emptyFollowUpForm);
  const [editingFollowUpId, setEditingFollowUpId] = useState<string>("");
  const [isFollowUpEditOpen, setIsFollowUpEditOpen] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<FollowUp | null>(null);
  const [isFollowUpDeleteOpen, setIsFollowUpDeleteOpen] = useState(false);
  const [isFollowUpsLoading, setIsFollowUpsLoading] = useState(false);
  const [conversionData, setConversionData] = useState<ConversionData>(emptyConversion);
  const [sources, setSources] = useState<LookupItem[]>([]);
  const [types, setTypes] = useState<LookupItem[]>([]);
  const [services, setServices] = useState<LookupItem[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [dealStages, setDealStages] = useState<LookupItem[]>([]);
  const [salesPersons, setSalesPersons] = useState<LookupItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  const { toast } = useToast();

  const activeFilterCount = [statusFilter, serviceFilter, assignedToFilter].filter(v => v !== "all").length;

  const fetchLeads = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      // Validate page number
      const validPage = Number(page) && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1;

      const params = new URLSearchParams({
        page: String(validPage),
        limit: String(pagination.itemsPerPage)
      });

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("leadStatusId", statusFilter);
      if (serviceFilter !== "all") params.append("serviceRequiredId", serviceFilter);
      if (assignedToFilter !== "all") params.append("assignedToUserId", assignedToFilter);

      const [sortBy, sortOrder] = sortValue.split("_");
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await fetch(`${BACKEND_BASE_URL}/api/leads?${params}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error("Failed to fetch leads");
      const result = await res.json();
      console.log("Leads API response:", result);

      setLeads(Array.isArray(result.data) ? result.data.map(mapBackendToFrontend) : []);

      // Update pagination based on response structure
      if (result.pagination) {
        setPagination({
          currentPage: result.pagination.currentPage || result.pagination.page || validPage,
          totalItems: result.pagination.totalItems || result.pagination.total || 0,
          totalPages: result.pagination.totalPages || 1,
          itemsPerPage: result.pagination.itemsPerPage || pagination.itemsPerPage,
          hasNextPage: result.pagination.hasNextPage || false,
          hasPrevPage: result.pagination.hasPrevPage || false
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, serviceFilter, assignedToFilter, sortValue, pagination.itemsPerPage, toast]);

  const fetchLookups = useCallback(async () => {
    try {
      const [srcRes, typeRes, statusRes, stageRes, serviceRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/leads/sources`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/leads/types`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/leads/statuses`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/deals/stages`, { headers: getAuthHeaders() }),
        fetch(`${BACKEND_BASE_URL}/api/leads/services`, { headers: getAuthHeaders() }),
      ]);
      const srcData = await srcRes.json();
      const typeData = await typeRes.json();
      const statusData = await statusRes.json();
      const stageData = await stageRes.json();
      const serviceData = await serviceRes.json();

      setSources(Array.isArray(srcData.data) ? srcData.data.map((s: any) => ({ id: String(s.SourceId), name: s.SourceName })) : []);
      setTypes(Array.isArray(typeData.data) ? typeData.data.map((t: any) => ({ id: String(t.LeadTypeId), name: t.TypeName })) : []);
      setStatuses(Array.isArray(statusData.data) ? statusData.data.map((s: any) => ({ id: String(s.LeadStatusId), name: s.StatusName })) : []);
      setDealStages(Array.isArray(stageData.data) ? stageData.data.map((s: any) => ({ id: String(s.DealStageId), name: s.StageName })) : []);
      setServices(Array.isArray(serviceData.data) ? serviceData.data.map((s: any) => ({ id: String(s.ServiceRequiredId), name: s.ServiceName })) : []);

      try {
        const spRes = await fetch(`${BACKEND_BASE_URL}/api/users/sales-persons`, { headers: getAuthHeaders() });
        if (spRes.ok) {
          const spData = await spRes.json();
          setSalesPersons(Array.isArray(spData.data) ? spData.data.map((u: any) => ({ id: String(u.UserId), name: u.Name })) : []);
        }
      } catch { /* ignore */ }
    } catch (error: any) {
      console.error("Failed to fetch lookups:", error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchLookups();
    fetchAppointmentStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search, filter, and sort changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, serviceFilter, assignedToFilter, sortValue, fetchLeads]);

  const fetchAppointmentStatuses = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/lookups/appointment-statuses`, { headers: getAuthHeaders() });
      if (res.ok) {
        const result = await res.json();
        setAppointmentStatuses(result.data || result || []);
      }
    } catch (err) {
      console.error("Failed to fetch appointment statuses", err);
    }
  };

  const fetchLeadDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lead details");
      const result = await res.json();
      const l = result.data;

      const mappedFormData: LeadFormData = {
        firstName: l.FirstName || "",
        lastName: l.LastName || "",
        email: l.Email || "",
        phone: l.Phone || "",
        mobile: l.Mobile || "",
        alternatePhone: l.AlternatePhone || "",
        companyName: l.CompanyName || "",
        industry: l.Industry || "",
        annualRevenue: l.AnnualRevenue || "",
        rating: l.Rating || "",
        designation: l.Designation || "",
        country: l.Country || "",
        state: l.State || "",
        city: l.City || "",
        address: l.Address || "",
        sourceId: l.SourceId ? String(l.SourceId) : "",
        leadTypeId: l.LeadTypeId ? String(l.LeadTypeId) : "",
        serviceRequiredId: l.ServiceRequiredId ? String(l.ServiceRequiredId) : "",
        estimatedValue: l.EstimatedValue != null ? String(l.EstimatedValue) : "",
        remarks: l.Remarks || "",
        assignedToUserId: l.AssignedToUserId ? String(l.AssignedToUserId) : "",
        leadStatusId: l.LeadStatusId ? String(l.LeadStatusId) : "",
      };
      setFormData(mappedFormData);
      return mappedFormData;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.lastName || !formData.email || !formData.phone || !formData.sourceId || !formData.leadTypeId || !formData.companyName) {
      toast({ title: "Validation Error", description: "Last Name, Company, Email, Phone, Source, and Type are required", variant: "destructive" });
      return;
    }
    try {
      const body: any = {
        FirstName: formData.firstName || null,
        LastName: formData.lastName,
        Email: formData.email,
        Phone: formData.phone,
        Mobile: formData.mobile || null,
        AlternatePhone: formData.alternatePhone || null,
        CompanyName: formData.companyName,
        Industry: formData.industry || null,
        AnnualRevenue: formData.annualRevenue || null,
        Rating: formData.rating || null,
        Designation: formData.designation || null,
        Country: formData.country || null,
        State: formData.state || null,
        City: formData.city || null,
        Address: formData.address || null,
        SourceId: formData.sourceId ? parseInt(formData.sourceId) : null,
        LeadTypeId: formData.leadTypeId ? parseInt(formData.leadTypeId) : null,
        ServiceRequiredId: formData.serviceRequiredId ? parseInt(formData.serviceRequiredId) : null,
        EstimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
        Remarks: formData.remarks || null,
        AssignedToUserId: formData.assignedToUserId ? parseInt(formData.assignedToUserId) : null,
      };
      if (formData.assignedToUserId) body.AssignedBy = parseInt(formData.assignedToUserId);

      const res = await fetch(`${BACKEND_BASE_URL}/api/leads`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to create lead"); }
      toast({ title: "Success", description: "Lead created successfully." });
      fetchLeads(pagination.currentPage);
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedLead || !formData.lastName || !formData.email || !formData.companyName) {
      toast({ title: "Validation Error", description: "Last Name, Company, and Email are required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          FirstName: formData.firstName || null,
          LastName: formData.lastName,
          Email: formData.email,
          Phone: formData.phone,
          Mobile: formData.mobile || null,
          AlternatePhone: formData.alternatePhone || null,
          CompanyName: formData.companyName,
          Industry: formData.industry || null,
          AnnualRevenue: formData.annualRevenue || null,
          Rating: formData.rating || null,
          Designation: formData.designation || null,
          Country: formData.country || null,
          State: formData.state || null,
          City: formData.city || null,
          Address: formData.address || null,
          SourceId: formData.sourceId ? parseInt(formData.sourceId) : undefined,
          LeadTypeId: formData.leadTypeId ? parseInt(formData.leadTypeId) : undefined,
          ServiceRequiredId: formData.serviceRequiredId ? parseInt(formData.serviceRequiredId) : undefined,
          EstimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
          Remarks: formData.remarks || undefined,
          LeadStatusId: formData.leadStatusId ? parseInt(formData.leadStatusId) : undefined,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to update lead"); }
      toast({ title: "Success", description: "Lead updated successfully." });
      fetchLeads(pagination.currentPage);
      setIsEditOpen(false);
      setSelectedLead(null);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedLead) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/${selectedLead.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to delete"); }
      toast({ title: "Success", description: "Lead deleted successfully." });
      fetchLeads(pagination.currentPage);
      setIsDeleteOpen(false);
      setSelectedLead(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentFormData.Title || !appointmentFormData.StartDateTime || !appointmentFormData.LeadId) {
      toast({ title: "Validation Error", description: "Title, Start Date/Time, and Lead are required.", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        Title: appointmentFormData.Title,
        LeadId: parseInt(appointmentFormData.LeadId),
        Agenda: appointmentFormData.Agenda || null,
        MeetingNotes: appointmentFormData.MeetingNotes || null,
        StartDateTime: appointmentFormData.StartDateTime,
        EndDateTime: appointmentFormData.EndDateTime || null,
        Duration: appointmentFormData.Duration ? parseInt(appointmentFormData.Duration) : 60,
        Mode: appointmentFormData.Mode,
        Location: appointmentFormData.Location || null,
        MeetingLink: appointmentFormData.MeetingLink || null,
        Outcome: appointmentFormData.Outcome || null,
        AppointmentStatusId: parseInt(appointmentFormData.AppointmentStatusId) || 1,
        NextFollowUpDate: appointmentFormData.NextFollowUpDate || null,
        FollowUpNotes: appointmentFormData.FollowUpNotes || null,
        AttendeesList: appointmentFormData.AttendeesList || null,
        ReminderEnabled: appointmentFormData.ReminderEnabled,
        ReminderMinutesBefore: appointmentFormData.ReminderMinutesBefore ? parseInt(appointmentFormData.ReminderMinutesBefore) : null,
      };

      const res = await fetch(`${BACKEND_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to schedule appointment");
      }

      toast({ title: "Success", description: "Appointment scheduled successfully." });
      setIsAppointmentOpen(false);
      setAppointmentFormData(emptyAppointmentForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openAppointment = (lead: Lead) => {
    setSelectedLead(lead);
    setAppointmentFormData({
      ...emptyAppointmentForm,
      LeadId: lead.id,
      Title: `Meeting with ${lead.name}`,
    });
    setIsAppointmentOpen(true);
  };

  const fetchFollowUpTypes = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/follow-up-types`, { headers: getAuthHeaders() });
      if (res.ok) {
        const result = await res.json();
        setFollowUpTypes(Array.isArray(result.data) ? result.data.map((t: any) => ({ id: String(t.FollowUpTypeId), name: t.TypeName })) : []);
      }
    } catch (err) {
      console.error("Failed to fetch follow-up types", err);
    }
  };

  const fetchFollowUps = async (leadId: string) => {
    setIsFollowUpsLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/${leadId}/followups`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch follow-ups");
      const result = await res.json();
      setFollowUps(Array.isArray(result.data) ? result.data.map((f: any) => ({
        id: String(f.FollowUpId),
        followUpDate: f.FollowUpDate || "",
        followUpTypeId: f.FollowUpTypeId ? String(f.FollowUpTypeId) : "",
        followUpTypeName: f.FollowUpTypeName || "",
        remarks: f.Remarks || "",
        nextFollowUpDate: f.NextFollowUpDate || "",
        createdAt: f.CreatedAt || "",
      })) : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFollowUpsLoading(false);
    }
  };

  const openCreateFollowUp = async (lead: Lead) => {
    setSelectedLead(lead);
    setFollowUpFormData(emptyFollowUpForm);
    setIsFollowUpOpen(true);
    await fetchFollowUpTypes();
  };

  const openFollowUpHistory = async (lead: Lead) => {
    setSelectedLead(lead);
    setIsFollowUpHistoryOpen(true);
    await fetchFollowUps(lead.id);
  };

  const openEditFollowUp = async (followUp: FollowUp) => {
    setEditingFollowUpId(followUp.id);
    setFollowUpEditFormData({
      FollowUpDate: toDateTimeLocal(followUp.followUpDate),
      FollowUpTypeId: followUp.followUpTypeId || "",
      Remarks: followUp.remarks || "",
      NextFollowUpDate: toDateTimeLocal(followUp.nextFollowUpDate),
    });
    await fetchFollowUpTypes();
    setIsFollowUpEditOpen(true);
  };

  const updateFollowUp = async () => {
    if (!selectedLead || !editingFollowUpId || !followUpEditFormData.FollowUpDate || !followUpEditFormData.FollowUpTypeId) {
      toast({ title: "Validation Error", description: "Follow-Up Date and Follow-Up Type are required.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/${selectedLead.id}/followups/${editingFollowUpId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          FollowUpDate: followUpEditFormData.FollowUpDate,
          FollowUpTypeId: parseInt(followUpEditFormData.FollowUpTypeId),
          Remarks: followUpEditFormData.Remarks || null,
          NextFollowUpDate: followUpEditFormData.NextFollowUpDate || null,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to update follow-up"); }
      toast({ title: "Success", description: "Follow-up updated successfully." });
      setIsFollowUpEditOpen(false);
      await fetchFollowUps(selectedLead.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openDeleteFollowUp = (followUp: FollowUp) => {
    setFollowUpToDelete(followUp);
    setIsFollowUpDeleteOpen(true);
  };

  const deleteFollowUp = async () => {
    if (!selectedLead || !followUpToDelete) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/${selectedLead.id}/followups/${followUpToDelete.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to delete follow-up"); }
      toast({ title: "Success", description: "Follow-up deleted successfully." });
      setIsFollowUpDeleteOpen(false);
      await fetchFollowUps(selectedLead.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const addFollowUp = async () => {
    if (!selectedLead || !followUpFormData.FollowUpDate || !followUpFormData.FollowUpTypeId) {
      toast({ title: "Validation Error", description: "Follow-Up Date and Follow-Up Type are required.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/${selectedLead.id}/followups`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          FollowUpDate: followUpFormData.FollowUpDate,
          FollowUpTypeId: parseInt(followUpFormData.FollowUpTypeId),
          Remarks: followUpFormData.Remarks || null,
          NextFollowUpDate: followUpFormData.NextFollowUpDate || null,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to add follow-up"); }
      toast({ title: "Success", description: "Follow-up added successfully." });
      setFollowUpFormData(emptyFollowUpForm);
      await fetchFollowUps(selectedLead.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    try {
      setIsConverting(true);
      const res = await fetch(`${BACKEND_BASE_URL}/api/leads/${selectedLead.id}/convert`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          createDeal: conversionData.createDeal,
          dealName: conversionData.dealName,
          dealStageId: conversionData.dealStageId ? parseInt(conversionData.dealStageId) : 1,
          closingDate: conversionData.closingDate,
          amount: conversionData.amount ? parseFloat(conversionData.amount) : null
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to convert lead"); }
      toast({ title: "Success", description: "Lead converted successfully." });
      fetchLeads(pagination.currentPage);
      setIsConvertOpen(false);
      setSelectedLead(null);
      setConversionData(emptyConversion);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsConverting(false);
    }
  };

  const openConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setConversionData({
      ...emptyConversion,
      dealName: `${lead.company || lead.name} Deal`
    });
    setIsConvertOpen(true);
  };

  const openCreate = () => { setFormData(emptyForm); setIsCreateOpen(true); };

  const openView = async (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewOpen(true);
    await fetchLeadDetail(lead.id);
  };

  const openEdit = async (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditOpen(true);
    await fetchLeadDetail(lead.id);
  };

  const openDelete = (lead: Lead) => { setSelectedLead(lead); setIsDeleteOpen(true); };

  // Pagination handlers
  const goToPreviousPage = () => {
    if (pagination.hasPrevPage && pagination.currentPage > 1) {
      fetchLeads(pagination.currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage && pagination.currentPage < pagination.totalPages) {
      fetchLeads(pagination.currentPage + 1);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Leads</h1>
            <p className="text-muted-foreground">Manage and track your sales leads</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="gap-2 gradient-primary text-primary-foreground shadow-glow w-full sm:w-auto" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={sortValue} onValueChange={setSortValue}>
                <SelectTrigger className="w-full md:w-[180px] gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest first</SelectItem>
                <SelectItem value="created_asc">Oldest first</SelectItem>
                <SelectItem value="estimatedValue_desc">Estimated Value (High to Low)</SelectItem>
                <SelectItem value="estimatedValue_asc">Estimated Value (Low to High)</SelectItem>
                <SelectItem value="name_asc">Name (A to Z)</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service</Label>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger><SelectValue placeholder="All services" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All services</SelectItem>
                      {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned To</Label>
                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger><SelectValue placeholder="All assigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All assigned</SelectItem>
                      {salesPersons.map(sp => <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setStatusFilter("all");
                      setServiceFilter("all");
                      setAssignedToFilter("all");
                    }}
                  >
                    Reset filters
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading leads...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No leads found.</div>
          ) : (
            <>
              {/* Mobile / tablet cards */}
              <div className="lg:hidden divide-y divide-border">
                {leads.map((lead) => (
                  <div key={lead.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className={cn("text-sm font-medium", leadTypeCircle[lead.leadTypeName] || "bg-primary/10 text-primary")}>
                            {lead.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.company || "—"}</p>
                        </div>
                      </div>
                      <LeadActions
                        lead={lead}
                        handlers={{
                          onCreateFollowUp: openCreateFollowUp,
                          onOpenFollowUpHistory: openFollowUpHistory,
                          onView: openView,
                          onEdit: openEdit,
                          onConvert: openConvert,
                          onAppointment: openAppointment,
                          onDelete: openDelete,
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("status-badge capitalize px-2 py-1 rounded-full text-xs font-medium", statusStyles[lead.statusName] || "bg-gray-100 text-gray-700")}>
                        {lead.statusName || "—"}
                      </span>
                      {lead.isConverted && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">Converted</Badge>
                      )}
                      <Badge variant="secondary">{lead.leadTypeName || "—"}</Badge>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Lead No.</dt>
                        <dd className="font-medium">{lead.leadNumber || "—"}</dd>
                      </div>
                      <div className="col-span-1">
                        <dt className="text-xs text-muted-foreground">Email</dt>
                        <dd className="font-medium truncate">{lead.email || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Source</dt>
                        <dd className="font-medium">{lead.sourceName || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Assigned To</dt>
                        <dd className="font-medium truncate">{lead.assignedTo || "Unassigned"}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="border-b border-border">
                      <th>Lead</th>
                      <th>Company</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className={cn("text-sm font-medium", leadTypeCircle[lead.leadTypeName] || "bg-primary/10 text-primary")}>
                                {lead.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.leadNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium">{lead.company || "—"}</p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{lead.sourceName || "—"}</span>
                            <span className="text-xs text-muted-foreground">{lead.serviceName || "—"}</span>
                          </div>
                        </td>
                        <td>
                          <span className={cn("status-badge capitalize px-2 py-1 rounded-full text-xs font-medium", statusStyles[lead.statusName] || "bg-gray-100 text-gray-700")}>
                            {lead.statusName || "—"}
                          </span>
                          {lead.isConverted && (
                            <Badge className="ml-2 bg-purple-100 text-purple-700 border-purple-200">Converted</Badge>
                          )}
                        </td>
                        <td>
                          {lead.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-[10px] bg-muted">
                                  {lead.assignedTo.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{lead.assignedTo}</span>
                            </div>
                          ) : <span className="text-muted-foreground text-sm">Unassigned</span>}
                        </td>
                        <td className="text-right">
                          <LeadActions
                            lead={lead}
                            handlers={{
                              onCreateFollowUp: openCreateFollowUp,
                              onOpenFollowUpHistory: openFollowUpHistory,
                              onView: openView,
                              onEdit: openEdit,
                              onConvert: openConvert,
                              onAppointment: openAppointment,
                              onDelete: openDelete,
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {leads.length} of {pagination.totalItems} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage || pagination.currentPage <= 1}
                onClick={goToPreviousPage}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || pagination.currentPage >= pagination.totalPages}
                onClick={goToNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CrudDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create New Lead" description="Add a new lead to your pipeline." saveLabel="Create Lead" onSave={handleCreate}>
        <FormFields
          data={formData}
          onChange={setFormData}
          sources={sources}
          types={types}
          salesPersons={salesPersons}
          readOnly={false}
          isCreate={true}
          isFetching={false}
          statuses={statuses}
          services={services}
        />
      </CrudDialog>

      <CrudDialog open={isViewOpen} onOpenChange={setIsViewOpen} title="Lead Details" mode="view">
        <FormFields
          data={formData}
          onChange={setFormData}
          sources={sources}
          types={types}
          salesPersons={salesPersons}
          readOnly={true}
          isCreate={false}
          isFetching={isFetchingDetail}
          statuses={statuses}
          services={services}
        />
      </CrudDialog>

      <CrudDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Lead" saveLabel="Save Changes" mode="edit" onSave={handleEdit}>
        <FormFields
          data={formData}
          onChange={setFormData}
          sources={sources}
          types={types}
          salesPersons={salesPersons}
          readOnly={false}
          isCreate={false}
          isFetching={isFetchingDetail}
          statuses={statuses}
          services={services}
        />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Lead"
        description={`Are you sure you want to delete "${selectedLead?.name}"? This action cannot be undone.`}
      />

      <CrudDialog
        open={isConvertOpen}
        onOpenChange={setIsConvertOpen}
        title="Convert Lead"
        description="Convert this lead into an Account and Contact. You can also optionally create a Deal."
        saveLabel={isConverting ? "Converting..." : "Convert"}
        onSave={handleConvert}
        disabled={isConverting}
      >
        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">This will create:</p>
            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
              <li>Account: <span className="text-foreground font-medium">{selectedLead?.company || "—"}</span></li>
              <li>Contact: <span className="text-foreground font-medium">{selectedLead?.name}</span></li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="createDeal"
              checked={conversionData.createDeal}
              onChange={(e) => setConversionData({ ...conversionData, createDeal: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="createDeal" className="cursor-pointer">Create a new deal for this account</Label>
          </div>

          {conversionData.createDeal && (
            <div className="space-y-3 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1.5">
                <Label>Deal Name *</Label>
                <Input
                  value={conversionData.dealName}
                  onChange={(e) => setConversionData({ ...conversionData, dealName: e.target.value })}
                  placeholder="Enter deal name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Deal Stage</Label>
                  <Select
                    value={conversionData.dealStageId}
                    onValueChange={(v) => setConversionData({ ...conversionData, dealStageId: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dealStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Closing Date</Label>
                  <Input
                    type="date"
                    value={conversionData.closingDate}
                    onChange={(e) => setConversionData({ ...conversionData, closingDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={conversionData.amount}
                  onChange={(e) => setConversionData({ ...conversionData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>
      </CrudDialog>

      <CrudDialog
        open={isAppointmentOpen}
        onOpenChange={setIsAppointmentOpen}
        title="Schedule Appointment"
        description={`Schedule a meeting for ${selectedLead?.name}`}
        saveLabel="Schedule"
        onSave={handleCreateAppointment}
      >
        <AppointmentFormFields
          data={appointmentFormData}
          onChange={setAppointmentFormData}
          leads={leads.map(l => ({ id: parseInt(l.id), label: l.name }))}
          statuses={appointmentStatuses}
          disableLeadSelect={true}
        />
      </CrudDialog>

      <CrudDialog
        open={isFollowUpOpen}
        onOpenChange={setIsFollowUpOpen}
        title="Create Follow-Up"
        description={`Schedule a follow-up for ${selectedLead?.name}`}
        saveLabel="Add Follow-Up"
        onSave={addFollowUp}
      >
        <FollowUpFormFields
          data={followUpFormData}
          onChange={setFollowUpFormData}
          types={followUpTypes}
        />
      </CrudDialog>

      <CrudDialog
        open={isFollowUpHistoryOpen}
        onOpenChange={setIsFollowUpHistoryOpen}
        title="Follow-ups"
        description={`Follow-ups for ${selectedLead?.name}`}
        mode="view"
      >
        <FollowUpHistoryList
          followUps={followUps}
          isFetching={isFollowUpsLoading}
          onEdit={openEditFollowUp}
          onDelete={openDeleteFollowUp}
        />
      </CrudDialog>

      <CrudDialog
        open={isFollowUpEditOpen}
        onOpenChange={setIsFollowUpEditOpen}
        title="Edit Follow-Up"
        description={`Update follow-up for ${selectedLead?.name}`}
        saveLabel="Update Follow-Up"
        onSave={updateFollowUp}
      >
        <FollowUpFormFields
          data={followUpEditFormData}
          onChange={setFollowUpEditFormData}
          types={followUpTypes}
        />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isFollowUpDeleteOpen}
        onOpenChange={setIsFollowUpDeleteOpen}
        title="Delete follow-up?"
        description={`This will delete the ${followUpToDelete?.followUpTypeName || "follow-up"} scheduled for ${followUpToDelete ? formatDateTime(followUpToDelete.followUpDate) : ""}. This action cannot be undone.`}
        onConfirm={deleteFollowUp}
      />
    </AppLayout>
  );
}