import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Loader2, User, Mail, Phone as PhoneIcon, Building2, Calendar, UserCircle } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE_URL } from "@/config";

interface Contact {
  id: string;
  contactNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  department: string;
  title: string;
  accountId: string;
  accountName: string;
  leadSource: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingCountry: string;
  mailingZip: string;
  description: string;
  creatorName: string;
  createdAt: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  department: string;
  title: string;
  accountId: string;
  leadSource: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingCountry: string;
  mailingZip: string;
  description: string;
}

interface AccountOption {
  AccountId: number;
  AccountName: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapBackendToFrontend = (c: any): Contact => ({
  id: String(c.ContactId),
  contactNumber: c.ContactNumber || "",
  firstName: c.FirstName || "",
  lastName: c.LastName || "",
  email: c.Email || "",
  phone: c.Phone || "",
  mobile: c.Mobile || "",
  department: c.Department || "",
  title: c.Title || "",
  accountId: String(c.AccountId || ""),
  accountName: c.AccountName || "",
  leadSource: c.LeadSource || "",
  mailingStreet: c.MailingStreet || "",
  mailingCity: c.MailingCity || "",
  mailingState: c.MailingState || "",
  mailingCountry: c.MailingCountry || "",
  mailingZip: c.MailingZip || "",
  description: c.Description || "",
  creatorName: c.CreatorName || "",
  createdAt: c.CreatedAt || "",
});

const emptyForm: ContactFormData = {
  firstName: "", lastName: "", email: "", phone: "", mobile: "",
  department: "", title: "", accountId: "", leadSource: "",
  mailingStreet: "", mailingCity: "", mailingState: "",
  mailingCountry: "", mailingZip: "", description: "",
};

interface AppointmentFormData {
  Title: string;
  ContactId: string;
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
  Title: "", ContactId: "",
  Agenda: "", MeetingNotes: "", StartDateTime: "", EndDateTime: "",
  Duration: "60", Mode: "Online", Location: "", MeetingLink: "",
  Outcome: "", AppointmentStatusId: "1", NextFollowUpDate: "",
  FollowUpNotes: "", AttendeesList: "", ReminderEnabled: false,
  ReminderMinutesBefore: "",
};

// Appointment Form Fields component (Full Version)
const AppointmentFormFields = ({
  data,
  onChange,
  contacts,
  statuses,
  readOnly = false,
  isFetching = false,
  showStatusField = false,
  disableContactSelect = false,
}: {
  data: AppointmentFormData;
  onChange: (d: AppointmentFormData) => void;
  contacts: { id: number; label: string }[];
  statuses: any[];
  readOnly?: boolean;
  isFetching?: boolean;
  showStatusField?: boolean;
  disableContactSelect?: boolean;
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
            placeholder="e.g. Follow-up Meeting"
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

      {/* ── Link To (mandatory relation) ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Link To</h3>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <UserCircle className="w-3 h-3" />
            Contact <span className="text-destructive ml-0.5">*</span>
          </Label>
          {readOnly || disableContactSelect ? (
            <Input
              value={contacts.find(c => String(c.id) === String(data.ContactId))?.label || (data.ContactId ? `Contact #${data.ContactId}` : "—")}
              disabled
              className="bg-muted"
            />
          ) : (
            <Select
              value={data.ContactId || ""}
              onValueChange={(v) => onChange({ ...data, ContactId: v })}
            >
              <SelectTrigger
                className={!data.ContactId ? "border-destructive/50 focus:ring-destructive/30" : ""}
              >
                <SelectValue placeholder="Select a contact *" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>
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

const FormFields = ({
  data,
  onChange,
  accounts,
  readOnly = false,
  isFetching = false,
}: {
  data: ContactFormData;
  onChange: (data: ContactFormData) => void;
  accounts: AccountOption[];
  readOnly?: boolean;
  isFetching?: boolean;
}) => {
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching contact details...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 py-2">
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={data.firstName} onChange={(e) => onChange({ ...data, firstName: e.target.value })} placeholder="John" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Last Name *</Label>
            <Input value={data.lastName} onChange={(e) => onChange({ ...data, lastName: e.target.value })} placeholder="Doe" disabled={readOnly} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder="john.doe@example.com" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={data.accountId} onValueChange={(v) => onChange({ ...data, accountId: v })} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.AccountId} value={String(acc.AccountId)}>{acc.AccountName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Manager" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={data.department} onChange={(e) => onChange({ ...data, department: e.target.value })} placeholder="Sales" disabled={readOnly} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} placeholder="+1 (555) 000-0000" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Mobile</Label>
            <Input value={data.mobile} onChange={(e) => onChange({ ...data, mobile: e.target.value })} placeholder="+1 (555) 000-0000" disabled={readOnly} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">Address & Extra</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mailing Street</Label>
            <Input value={data.mailingStreet} onChange={(e) => onChange({ ...data, mailingStreet: e.target.value })} disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Mailing City</Label>
            <Input value={data.mailingCity} onChange={(e) => onChange({ ...data, mailingCity: e.target.value })} disabled={readOnly} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label>State</Label>
            <Input value={data.mailingState} onChange={(e) => onChange({ ...data, mailingState: e.target.value })} disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={data.mailingCountry} onChange={(e) => onChange({ ...data, mailingCountry: e.target.value })} disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Zip</Label>
            <Input value={data.mailingZip} onChange={(e) => onChange({ ...data, mailingZip: e.target.value })} disabled={readOnly} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Lead Source</Label>
          <Input value={data.leadSource} onChange={(e) => onChange({ ...data, leadSource: e.target.value })} placeholder="Web Search" disabled={readOnly} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="Additional notes..." disabled={readOnly} />
      </div>
    </div>
  );
};

interface PaginationData {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(emptyForm);
  const [appointmentFormData, setAppointmentFormData] = useState<AppointmentFormData>(emptyAppointmentForm);
  const [appointmentStatuses, setAppointmentStatuses] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const { toast } = useToast();

  const fetchContacts = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.itemsPerPage)
      });
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`${BACKEND_BASE_URL}/api/contacts?${params}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error("Failed to fetch contacts");
      const result = await res.json();
      setContacts(Array.isArray(result.data) ? result.data.map(mapBackendToFrontend) : []);

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
  }, [searchQuery, pagination.itemsPerPage, toast]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/accounts?limit=1000`, { headers: getAuthHeaders() });
      if (res.ok) {
        const result = await res.json();
        setAccounts(result.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    }
  };

  useEffect(() => {
    fetchContacts(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchAccounts();
    fetchAppointmentStatuses();
  }, []);

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

  const fetchContactDetail = async (id: string) => {
    setIsFetchingDetail(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/contacts/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch contact details");
      const result = await res.json();
      const c = result.data;

      const mappedFormData: ContactFormData = {
        firstName: c.FirstName || "",
        lastName: c.LastName || "",
        email: c.Email || "",
        phone: c.Phone || "",
        mobile: c.Mobile || "",
        department: c.Department || "",
        title: c.Title || "",
        accountId: String(c.AccountId || ""),
        leadSource: c.LeadSource || "",
        mailingStreet: c.MailingStreet || "",
        mailingCity: c.MailingCity || "",
        mailingState: c.MailingState || "",
        mailingCountry: c.MailingCountry || "",
        mailingZip: c.MailingZip || "",
        description: c.Description || "",
      };
      setFormData(mappedFormData);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.lastName) {
      toast({ title: "Validation Error", description: "Last Name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/contacts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          FirstName: formData.firstName || null,
          LastName: formData.lastName,
          Email: formData.email || null,
          Phone: formData.phone || null,
          Mobile: formData.mobile || null,
          Department: formData.department || null,
          Title: formData.title || null,
          AccountId: formData.accountId ? parseInt(formData.accountId) : null,
          LeadSource: formData.leadSource || null,
          MailingStreet: formData.mailingStreet || null,
          MailingCity: formData.mailingCity || null,
          MailingState: formData.mailingState || null,
          MailingCountry: formData.mailingCountry || null,
          MailingZip: formData.mailingZip || null,
          Description: formData.description || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create contact");
      toast({ title: "Success", description: "Contact created successfully." });
      fetchContacts(pagination.currentPage);
      setIsCreateOpen(false);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedContact || !formData.lastName) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/contacts/${selectedContact.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          FirstName: formData.firstName || null,
          LastName: formData.lastName,
          Email: formData.email || null,
          Phone: formData.phone || null,
          Mobile: formData.mobile || null,
          Department: formData.department || null,
          Title: formData.title || null,
          AccountId: formData.accountId ? parseInt(formData.accountId) : null,
          LeadSource: formData.leadSource || null,
          MailingStreet: formData.mailingStreet || null,
          MailingCity: formData.mailingCity || null,
          MailingState: formData.mailingState || null,
          MailingCountry: formData.mailingCountry || null,
          MailingZip: formData.mailingZip || null,
          Description: formData.description || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update contact");
      toast({ title: "Success", description: "Contact updated successfully." });
      fetchContacts(pagination.currentPage);
      setIsEditOpen(false);
      setSelectedContact(null);
      setFormData(emptyForm);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedContact) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/contacts/${selectedContact.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete contact");
      toast({ title: "Success", description: "Contact deleted successfully." });
      fetchContacts(pagination.currentPage);
      setIsDeleteOpen(false);
      setSelectedContact(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentFormData.Title || !appointmentFormData.StartDateTime || !appointmentFormData.ContactId) {
      toast({ title: "Validation Error", description: "Title, Start Date/Time, and Contact are required.", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        Title: appointmentFormData.Title,
        ContactId: parseInt(appointmentFormData.ContactId),
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

  const openCreate = () => { setFormData(emptyForm); setIsCreateOpen(true); };
  const openView = async (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewOpen(true);
    await fetchContactDetail(contact.id);
  };
  const openEdit = async (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditOpen(true);
    await fetchContactDetail(contact.id);
  };
  const openDelete = (contact: Contact) => { setSelectedContact(contact); setIsDeleteOpen(true); };

  const openAppointment = (contact: Contact) => {
    setSelectedContact(contact);
    setAppointmentFormData({
      ...emptyAppointmentForm,
      ContactId: contact.id,
      Title: `Meeting with ${contact.firstName} ${contact.lastName}`,
    });
    setIsAppointmentOpen(true);
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevPage && pagination.currentPage > 1) {
      fetchContacts(pagination.currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage && pagination.currentPage < pagination.totalPages) {
      fetchContacts(pagination.currentPage + 1);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Contacts</h1>
            <p className="text-muted-foreground">Manage your customer contacts and relationships</p>
          </div>
          <Button className="gap-2 gradient-primary text-primary-foreground shadow-glow" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>

        <div className="card-elevated p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => fetchContacts(pagination.currentPage)}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="card-elevated overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading contacts...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-border">
                    <th>Contact</th>
                    <th>Account</th>
                    <th>Title & Dept</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">No contacts found.</td>
                    </tr>
                  ) : (
                    contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                              <p className="text-xs text-muted-foreground">{contact.contactNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{contact.accountName || "—"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <p className="font-medium">{contact.title || "—"}</p>
                            <p className="text-xs text-muted-foreground">{contact.department || "—"}</p>
                          </div>
                        </td>
                        <td>
                          {contact.email ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {contact.email}
                            </div>
                          ) : "—"}
                        </td>
                        <td>
                          {contact.phone ? (
                            <div className="flex items-center gap-2 text-sm">
                              <PhoneIcon className="w-3 h-3 text-muted-foreground" />
                              {contact.phone}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(contact)}><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(contact)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAppointment(contact)}>
                                <Calendar className="w-4 h-4 mr-2" />Schedule Appointment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => openDelete(contact)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
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
            <p className="text-sm text-muted-foreground">
              Showing {contacts.length} of {pagination.totalItems} contacts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                onClick={goToPreviousPage}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-medium">{pagination.currentPage}</span>
                <span className="text-sm text-muted-foreground">of {pagination.totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={goToNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CrudDialog
        title="Add New Contact"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={handleCreate}
      >
        <FormFields data={formData} onChange={setFormData} accounts={accounts} />
      </CrudDialog>

      <CrudDialog
        title={`Edit: ${selectedContact?.firstName} ${selectedContact?.lastName}`}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        onSave={handleEdit}
      >
        <FormFields data={formData} onChange={setFormData} accounts={accounts} isFetching={isFetchingDetail} />
      </CrudDialog>

      <CrudDialog
        title="Contact Details"
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        mode="view"
      >
        <FormFields data={formData} onChange={() => { }} accounts={accounts} readOnly isFetching={isFetchingDetail} />
      </CrudDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Contact"
        description={`Are you sure you want to delete ${selectedContact?.firstName} ${selectedContact?.lastName}? This action cannot be undone.`}
      />

      <CrudDialog
        open={isAppointmentOpen}
        onOpenChange={setIsAppointmentOpen}
        title="Schedule Appointment"
        description={`Schedule a meeting for ${selectedContact?.firstName} ${selectedContact?.lastName}`}
        saveLabel="Schedule"
        onSave={handleCreateAppointment}
      >
        <AppointmentFormFields
          data={appointmentFormData}
          onChange={setAppointmentFormData}
          contacts={contacts.map(c => ({ id: parseInt(c.id), label: `${c.firstName} ${c.lastName}` }))}
          statuses={appointmentStatuses}
          disableContactSelect={true}
        />
      </CrudDialog>
    </AppLayout>
  );
}
